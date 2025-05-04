import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  File,
  FileCheck,
  FileX,
  Download,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDocument } from '@/lib/documentService';
import { useToast } from '@/hooks/use-toast';

export interface DocumentCardProps {
  document: {
    id: number;
    filename: string;
    type: string;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
    fileSize?: number;
    fileType?: string;
    notes?: string;
  };
  onDelete?: (documentId: number) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete }) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Format file size to human-readable format
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Get icon based on document type and status
  const getStatusIcon = () => {
    if (document.status === 'processing') return <Loader2 className="h-5 w-5 animate-spin" />;
    if (document.status === 'error') return <FileX className="h-5 w-5" />;
    if (document.status === 'processed') return <FileCheck className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };
  
  // Get status color class
  const getStatusColorClass = () => {
    switch (document.status) {
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'deleted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle document deletion
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDocument(document.id);
      toast({
        title: 'Document deleted',
        description: 'The document has been successfully deleted.',
      });
      if (onDelete) {
        onDelete(document.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
    }
  };
  
  // Format document type for display
  const formatDocumentType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get file type icon
  const getFileTypeIcon = () => {
    if (!document.fileType) return <FileText className="h-5 w-5" />;
    
    if (document.fileType.includes('pdf')) return <FileText className="h-5 w-5" />;
    if (document.fileType.includes('image')) return <FileText className="h-5 w-5" />;
    if (document.fileType.includes('word')) return <FileText className="h-5 w-5" />;
    
    return <FileText className="h-5 w-5" />;
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center p-4 border-b">
          <div className="mr-4">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-gray-100">
              {getFileTypeIcon()}
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm truncate">{document.filename}</h4>
            <div className="text-xs text-gray-500 mt-1">
              <span className="mr-3">{formatDocumentType(document.type)}</span>
              <span>{formatFileSize(document.fileSize)}</span>
              {document.createdAt && (
                <span className="ml-3">
                  Uploaded {new Date(document.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center">
            <span className={`text-xs px-2.5 py-0.5 rounded-full h-fit mr-3 ${getStatusColorClass()}`}>
              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
            </span>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                title="View Document"
                disabled={document.status !== 'processed'}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                title="Download Document"
                disabled={document.status !== 'processed'}
              >
                <Download className="h-4 w-4" />
              </Button>
              <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-500 hover:text-red-600"
                    title="Delete Document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{document.filename}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
        
        {/* Additional information section, e.g., extracted data or errors */}
        {document.notes && document.status !== 'deleted' && (
          <div className="p-4 bg-gray-50 text-sm">
            <div className="font-medium mb-1">Document Notes:</div>
            <div className="text-gray-600 whitespace-pre-wrap">
              {document.notes}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentCard;