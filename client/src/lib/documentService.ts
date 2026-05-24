import axios from 'axios';

// Document types and their corresponding webhook endpoints
export const DOCUMENT_TYPES = {
  death_certificate: {
    name: 'Death Certificate',
    description: 'The official death certificate issued by the registry office',
    webhookEndpoint: 'https://n8n.probateswift.com/webhook/fileupload-dc',
  },
  identification: {
    name: 'Identification Document',
    description: 'Passport, driving license, or other official ID document',
    webhookEndpoint: 'https://n8n.probateswift.com/webhook/fileupload-id',
  },
  will: {
    name: 'Will & Codicils',
    description: 'The original will and any codicils (amendments to the will)',
    webhookEndpoint: 'https://n8n.probateswift.com/webhook/fileupload-will',
  },
  property: {
    name: 'Property Document',
    description: 'Property deeds, mortgage statements, or valuations',
    webhookEndpoint: 'https://n8n.probateswift.com/webhook/fileupload-prop',
  },
  financial: {
    name: 'Financial Document',
    description: 'Bank statements, investment records, or pension details',
    webhookEndpoint: 'https://n8n.probateswift.com/webhook/fileupload-fin',
  },
  tax: {
    name: 'Tax Document',
    description: 'Tax returns, HMRC correspondence, or inheritance tax forms',
    webhookEndpoint: 'https://n8n.probateswift.com/webhook/fileupload-tax',
  },
  general: {
    name: 'Other Document',
    description: 'Any other document related to the estate',
    webhookEndpoint: 'https://n8n.probateswift.com/webhook/fileupload-user-defined',
  },
};

export interface DocumentUploadResponse {
  success: boolean;
  documentId?: number;
  message?: string;
  error?: string;
}

export interface DocumentAnalysisResult {
  documentId: number;
  documentType: string;
  extractedData: any;
  status: 'processed' | 'error';
  message?: string;
}

export interface DocumentUploadProgress {
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  message?: string;
  documentId?: number;
}

/**
 * Uploads a document to the server, which will forward it to the webhook endpoint
 */
export async function uploadDocument(
  file: File, 
  caseId: number,
  category: string = 'general',
  onProgress?: (progress: DocumentUploadProgress) => void
): Promise<DocumentUploadResponse> {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', caseId.toString());
    formData.append('category', category);
    
    // Special handling for document types with dedicated webhooks
    if (category in DOCUMENT_TYPES) {
      const docType = category as keyof typeof DOCUMENT_TYPES;
      formData.append('webhookTarget', DOCUMENT_TYPES[docType].webhookEndpoint);
    }
    
    // Update progress to preparing
    if (onProgress) {
      onProgress({
        status: 'uploading',
        progress: 10,
        message: 'Preparing upload...'
      });
    }
    
    // Upload the file
    const response = await axios.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            status: 'uploading',
            progress: percentCompleted,
            message: `Uploading: ${percentCompleted}%`
          });
        }
      }
    });
    
    // Update progress to processing
    if (onProgress && response.data.documentId) {
      onProgress({
        status: 'processing',
        progress: 100,
        message: 'Document uploaded, waiting for processing...',
        documentId: response.data.documentId
      });
    }
    
    return {
      success: response.data.success,
      documentId: response.data.documentId,
      message: response.data.message
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        error: error.response.data.error || 'Upload failed'
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Polls for document processing status - can be used to check if webhook has processed the document
 */
export async function checkDocumentStatus(documentId: number): Promise<DocumentAnalysisResult | null> {
  try {
    const response = await axios.get(`/api/documents/item/${documentId}`);
    
    if (response.data && response.data.status) {
      // If processing is complete, return the result
      if (response.data.status === 'processed') {
        return {
          documentId: response.data.id,
          documentType: response.data.type,
          extractedData: response.data.metadata ? JSON.parse(response.data.metadata) : {},
          status: 'processed'
        };
      }
      
      // If there was an error, return that
      if (response.data.status === 'error') {
        return {
          documentId: response.data.id,
          documentType: response.data.type,
          extractedData: {},
          status: 'error',
          message: response.data.notes || 'Document processing failed'
        };
      }
    }
    
    // Still processing
    return null;
  } catch (error) {
    console.error('Error checking document status:', error);
    return null;
  }
}

/**
 * Deletes a document
 */
export async function deleteDocument(documentId: number): Promise<boolean> {
  try {
    const response = await axios.delete(`/api/documents/${documentId}`);
    return response.data.success;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}