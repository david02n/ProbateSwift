import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2, FileText, FileCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { uploadDocument, DocumentUploadProgress, DocumentAnalysisResult } from "@/lib/documentService";

interface DocumentUploaderProps {
  caseId: number;
  category?: string;
  onUploadComplete?: (result: DocumentAnalysisResult) => void;
  onUploadError?: (error: string) => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  caseId,
  category,
  onUploadComplete,
  onUploadError
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<DocumentUploadProgress | null>(null);
  const [pollingId, setPollingId] = useState<NodeJS.Timeout | null>(null);
  const [uploadedDocId, setUploadedDocId] = useState<number | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingId) {
        clearInterval(pollingId);
      }
    };
  }, [pollingId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Check file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      // Reset progress
      setUploadProgress(null);
      setUploadedDocId(null);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      
      // Check file size (10MB max)
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setFile(droppedFile);
      // Reset progress
      setUploadProgress(null);
      setUploadedDocId(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setUploadProgress({
      status: 'uploading',
      progress: 0,
      message: 'Starting upload...'
    });

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (!prev) return null;
        
        // Only increase progress if we're still uploading
        if (prev.status === 'uploading' && prev.progress < 90) {
          return {
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
            message: 'Uploading file...'
          };
        }
        return prev;
      });
    }, 300);

    try {
      const response = await uploadDocument(file, caseId, category);
      
      clearInterval(progressInterval);
      
      if (response.success && response.documentId) {
        setUploadedDocId(response.documentId);
        setUploadProgress({
          status: 'processing',
          progress: 95,
          message: 'Processing document...',
          documentId: response.documentId
        });
        
        // Start polling for document processing status
        startPolling(response.documentId);
      } else {
        setUploadProgress({
          status: 'error',
          progress: 100,
          message: response.error || 'Failed to upload document'
        });
        
        if (onUploadError) {
          onUploadError(response.error || 'Unknown error occurred');
        }
      }
    } catch (error) {
      clearInterval(progressInterval);
      
      setUploadProgress({
        status: 'error',
        progress: 100,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      if (onUploadError) {
        onUploadError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }
  };

  const startPolling = (documentId: number) => {
    // Poll every 2 seconds for document status
    const id = setInterval(async () => {
      try {
        // This would normally call checkDocumentStatus, but for demo we'll simulate
        // Simulate webhook response after 3-5 seconds
        setTimeout(() => {
          const mockResult: DocumentAnalysisResult = {
            documentId,
            documentType: category || 'unknown',
            extractedData: {
              dateProcessed: new Date().toISOString(),
              extractedText: "Sample extracted text from document"
            },
            status: 'processed'
          };
          
          setUploadProgress({
            status: 'complete',
            progress: 100,
            message: 'Document processed successfully',
            documentId
          });
          
          if (onUploadComplete) {
            onUploadComplete(mockResult);
          }
          
          clearInterval(pollingId!);
          setPollingId(null);
        }, 3000 + Math.random() * 2000);
      } catch (error) {
        console.error('Error polling document status:', error);
      }
    }, 2000);
    
    setPollingId(id);
  };

  const resetUpload = () => {
    setFile(null);
    setUploadProgress(null);
    setUploadedDocId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (pollingId) {
      clearInterval(pollingId);
      setPollingId(null);
    }
  };

  return (
    <div>
      {!file ? (
        <div 
          className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Drag & Drop File</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Upload PDF, image, or document file (max 10MB)
          </p>
          
          <div className="text-center flex flex-col items-center mb-4">
            <p className="text-sm text-gray-500">drag & drop file</p>
            <p className="text-sm text-gray-500 my-2">OR</p>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            onChange={handleFileChange} 
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          />
          <Button 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Browse Files
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">{file.name}</h4>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(0)} KB • {file.type || 'Unknown file type'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                resetUpload();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {uploadProgress ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  {uploadProgress.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                  )}
                  {uploadProgress.status === 'processing' && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-amber-500" />
                  )}
                  {uploadProgress.status === 'complete' && (
                    <FileCheck className="h-4 w-4 mr-2 text-green-500" />
                  )}
                  {uploadProgress.status === 'error' && (
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                  )}
                  <span>
                    {uploadProgress.message || 
                     (uploadProgress.status === 'uploading' ? 'Uploading...' : 
                      uploadProgress.status === 'processing' ? 'Processing...' : 
                      uploadProgress.status === 'complete' ? 'Complete' : 'Error')}
                  </span>
                </div>
                <span className="text-gray-500">{uploadProgress.progress}%</span>
              </div>
              
              <Progress value={uploadProgress.progress} className="h-2" />
              
              {uploadProgress.status === 'error' && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetUpload}
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              {uploadProgress.status === 'complete' && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetUpload}
                  >
                    Upload Another
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex space-x-3 mt-4">
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={handleUpload}
              >
                Upload
              </Button>
              <Button 
                variant="outline"
                onClick={resetUpload}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;