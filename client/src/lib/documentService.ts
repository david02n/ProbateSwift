import { apiRequest } from "./queryClient";

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
  category?: string
): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('caseId', caseId.toString());
  
  if (category) {
    formData.append('category', category);
  }

  try {
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header, browser will set it with boundary for multipart/form-data
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading document:', error);
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
    const response = await apiRequest('GET', `/api/documents/${documentId}`);
    if (!response.ok) {
      throw new Error(`Failed to get document status: ${response.statusText}`);
    }
    
    const document = await response.json();
    
    // If the document has been processed by the webhook
    if (document.status === 'processed') {
      return {
        documentId: document.id,
        documentType: document.type,
        extractedData: document.metadata ? JSON.parse(document.metadata) : {},
        status: 'processed'
      };
    }
    
    return null; // Still processing
  } catch (error) {
    console.error('Error checking document status:', error);
    return {
      documentId,
      documentType: 'unknown',
      extractedData: {},
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Deletes a document
 */
export async function deleteDocument(documentId: number): Promise<boolean> {
  try {
    const response = await apiRequest('DELETE', `/api/documents/${documentId}`);
    return response.ok;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
}