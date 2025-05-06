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
  Loader2,
  Copy,
  ChevronsUpDown
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteDocument } from '@/lib/documentService';
import { useToast } from '@/hooks/use-toast';

export interface DocumentCardProps {
  document: {
    id: number;
    filename: string;
    type: string;
    status: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    fileSize?: number;
    fileType?: string;
    notes?: string;
    name?: string; // For backward compatibility
  };
  onDelete?: (documentId: number) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete }) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Function to copy text to clipboard
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied!',
        description: `${fieldName} copied to clipboard`,
        duration: 2000,
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    });
  };
  
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
  
  // Format date in a user-friendly format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  // Check if document has extractable data
  const hasExtractableData = document.notes && document.status === 'processed';
  
  // Extract document data for display
  let extractedData: any = null;
  if (hasExtractableData && document.notes) {
    try {
      // Try to parse JSON from notes
      if (document.notes.includes('```json')) {
        const jsonMatch = document.notes.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          extractedData = JSON.parse(jsonMatch[1]);
        }
      } else if (document.notes.includes('"type"')) {
        const jsonCandidate = document.notes.replace(/\\"/g, '"').match(/\{[\s\S]*\}/);
        if (jsonCandidate) {
          extractedData = JSON.parse(jsonCandidate[0]);
        }
      } else {
        try {
          extractedData = JSON.parse(document.notes);
          if (extractedData.webhookResponse && extractedData.webhookResponse.content) {
            const content = extractedData.webhookResponse.content;
            if (content.includes('```json')) {
              const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
              if (jsonMatch && jsonMatch[1]) {
                extractedData = JSON.parse(jsonMatch[1]);
              }
            }
          }
        } catch (e) {
          console.log("Failed to parse notes as JSON");
        }
      }
    } catch (e) {
      console.error("Error extracting document data:", e);
    }
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div className="flex">
            <div className={`h-10 w-10 rounded-md ${getStatusColorClass()} flex items-center justify-center mr-3`}>
              {getStatusIcon()}
            </div>
            <div>
              <h4 className="font-medium">{document.name || document.filename}</h4>
              <div className="text-xs text-gray-500 flex items-center flex-wrap gap-x-2">
                <span>{formatDocumentType(document.type)}</span>
                {document.fileSize && <span>• {formatFileSize(document.fileSize)}</span>}
                {document.createdAt && <span>• Uploaded {new Date(document.createdAt).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
          
          {/* Status badge and actions */}
          <div className="flex items-center">
            <Badge variant="outline" className={`mr-2 ${getStatusColorClass()}`}>
              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
            </Badge>
            <div className="flex space-x-1">
              {/* View document (opens in new tab) */}
              {document.status === 'processed' && (
                <a 
                  href={`/api/documents/${document.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-500 hover:text-gray-900"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </a>
              )}
              
              {/* Download document */}
              <a 
                href={`/api/documents/${document.id}/download`}
                download
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-500 hover:text-gray-900"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </a>
              
              {/* Delete document */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-500 hover:text-red-600"
                onClick={() => setDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Document details collapsible section */}
        {hasExtractableData && (
          <Collapsible 
            open={isDetailsOpen} 
            onOpenChange={setIsDetailsOpen}
            className="mt-4 border-t pt-4"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium">
              <span className="text-primary">View Extracted Details</span>
              <ChevronsUpDown className="h-4 w-4" />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-2">
              {extractedData ? (
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type */}
                    <div className="flex flex-col space-y-1">
                      <div className="text-xs text-gray-500">Type</div>
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {extractedData.type || formatDocumentType(document.type)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(
                            extractedData.type || formatDocumentType(document.type), 
                            'Type'
                          )}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Full Name */}
                    {(extractedData.firstName || extractedData.surname) && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Full Name</div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {`${extractedData.firstName || ''} ${extractedData.surname || ''}`}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              `${extractedData.firstName || ''} ${extractedData.surname || ''}`, 
                              'Full Name'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Date of Birth */}
                    {extractedData.dateOfBirth && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Date of Birth</div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {new Date(extractedData.dateOfBirth).toLocaleDateString('en-GB')}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              new Date(extractedData.dateOfBirth).toLocaleDateString('en-GB'), 
                              'Date of Birth'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Date of Death */}
                    {extractedData.dateOfDeath && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Date of Death</div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {new Date(extractedData.dateOfDeath).toLocaleDateString('en-GB')}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              new Date(extractedData.dateOfDeath).toLocaleDateString('en-GB'), 
                              'Date of Death'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Address */}
                    {extractedData.address && (
                      <div className="flex flex-col space-y-1 col-span-2">
                        <div className="text-xs text-gray-500">Address</div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {extractedData.address}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.address, 
                              'Address'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Application Number */}
                    {extractedData.applicationNumber && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Application Number</div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {extractedData.applicationNumber}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.applicationNumber, 
                              'Application Number'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Other data fields */}
                    {Object.entries(extractedData).filter(([key]) => 
                      !['type', 'firstName', 'surname', 'dateOfBirth', 'dateOfDeath', 'address', 'applicationNumber'].includes(key)
                    ).map(([key, value]) => (
                      <div key={key} className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {String(value)}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              String(value), 
                              key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                            )}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  No structured data could be extracted from this document.
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Document details modal */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Details: {document.name || document.filename}</DialogTitle>
          </DialogHeader>
          {extractedData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-gray-50 p-4 rounded-md col-span-2 md:col-span-1 max-h-[70vh] overflow-y-auto">
                <iframe
                  src={`/api/documents/${document.id}/view`}
                  className="w-full h-full min-h-[400px]"
                  title="Document Preview"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md col-span-2 md:col-span-1 max-h-[70vh] overflow-y-auto">
                <h3 className="text-lg font-medium mb-4">Extracted Data</h3>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(extractedData).map(([key, value]) => (
                    <div key={key} className="border-b pb-2">
                      <div className="text-sm text-gray-500 mb-1">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {typeof value === 'string' && (value.includes('-') || value.includes('/')) && 
                           !isNaN(Date.parse(value)) ? 
                            new Date(value).toLocaleDateString('en-GB') : 
                            String(value)
                          }
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 gap-1"
                          onClick={() => copyToClipboard(
                            String(value), 
                            key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                          )}
                        >
                          <Copy className="h-3 w-3" />
                          <span className="text-xs">Copy</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Extracted Data</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No structured data could be extracted from this document.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DocumentCard;