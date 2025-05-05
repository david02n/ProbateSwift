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
  UserIcon,
  Calendar,
  MapPin,
  Hash
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
import { Badge } from "@/components/ui/badge";
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
  
  // Format date in a user-friendly format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  // Try to parse and display extracted document data
  const tryParseExtractedData = (notes: string) => {
    try {
      console.log("Processing document notes:", notes);
      
      // First try to parse the entire notes as JSON
      let notesText = notes;
      try {
        const notesObj = JSON.parse(notes);
        if (notesObj.webhookResponse && notesObj.webhookResponse.content) {
          notesText = notesObj.webhookResponse.content;
        }
      } catch (e) {
        // Not a valid JSON, continue with other parsing methods
        console.log("Notes are not directly a valid JSON object");
      }
      
      // Extract JSON data from markdown code blocks if present
      let extractedData: any = null;
      
      // Check for JSON code blocks
      if (typeof notesText === 'string' && notesText.includes('```json')) {
        console.log("Found JSON code block in notes");
        const jsonMatch = notesText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            extractedData = JSON.parse(jsonMatch[1]);
            console.log("Extracted data from JSON code block:", extractedData);
          } catch (e) {
            console.error("Failed to parse JSON from code block:", e);
          }
        }
      }
      
      // Check if it might be escaped JSON
      if (!extractedData && typeof notesText === 'string' && notesText.includes('"type"')) {
        try {
          // Try to find a JSON-like structure by looking for opening and closing braces
          const jsonCandidate = notesText.replace(/\\"/g, '"').match(/\{[\s\S]*\}/);
          if (jsonCandidate) {
            extractedData = JSON.parse(jsonCandidate[0]);
            console.log("Extracted data from potential JSON structure:", extractedData);
          }
        } catch (e) {
          console.error("Failed to parse potential JSON structure:", e);
        }
      }
      
      // If we have extracted data, render the appropriate component
      if (extractedData) {
        // For Death Certificate
        if (document.type === 'death_certificate' || 
            (extractedData.type && extractedData.type.toLowerCase().includes('death'))) {
          console.log("Rendering death certificate format");
          return (
            <div className="p-4 bg-gray-50">
              {/* Top header with name and document properties */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {`${extractedData.firstName || ''} ${extractedData.surname || ''}`}
                  </h3>
                  <div className="text-sm text-gray-600 mt-0.5 flex items-center">
                    <span>Death Certificate</span>
                    {document.fileSize && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{formatFileSize(document.fileSize)}</span>
                      </>
                    )}
                    {document.createdAt && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Uploaded {new Date(document.createdAt).toLocaleDateString('en-GB')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Processed
                  </span>
                  <div className="flex space-x-1">
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
              
              {/* Certificate details in clean grid layout */}
              <div className="mt-6 grid grid-cols-2 gap-y-4 text-sm border-t border-gray-200 pt-4">
                {extractedData.dateOfBirth && (
                  <div className="col-span-1">
                    <div className="text-gray-500">date of birth:</div>
                    <div className="font-medium mt-1">
                      {new Date(extractedData.dateOfBirth).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                )}
                
                {extractedData.address && (
                  <div className="col-span-1 row-span-2">
                    <div className="text-gray-500">address:</div>
                    <div className="font-medium mt-1">
                      {extractedData.address.split(" ").slice(0, -1).join(" ").replace(/,\s*$/, "").split(' ').map((part: string, i: number, arr: string[]) => (
                        <React.Fragment key={i}>
                          {part}
                          {i < arr.length - 1 && i % 2 === 1 ? <br /> : ' '}
                        </React.Fragment>
                      ))}
                      <br />
                      {extractedData.address.split(" ").slice(-1)}
                    </div>
                  </div>
                )}
                
                {extractedData.dateOfDeath && (
                  <div className="col-span-1">
                    <div className="text-gray-500">date of death:</div>
                    <div className="font-medium mt-1">
                      {new Date(extractedData.dateOfDeath).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                )}
                
                {extractedData.applicationNumber && (
                  <div className="col-span-1">
                    <div className="text-gray-500">application #:</div>
                    <div className="font-medium mt-1">{extractedData.applicationNumber}</div>
                  </div>
                )}
              </div>
            </div>
          );
        }
        
        // Add more document type renderers here (ID, will, etc.)
        
        // Generic fallback for any other JSON data
        return (
          <div>
            <div className="font-medium mb-2">Extracted Information:</div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(extractedData).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
            <Badge variant="outline" className="mt-3 bg-blue-50">Extracted Data</Badge>
          </div>
        );
      }
      
      // If we can't parse JSON or find json codeblocks, display the notes as is
      return (
        <div>
          <div className="font-medium mb-1">Document Notes:</div>
          <div className="text-gray-600 whitespace-pre-wrap">
            {typeof notes === 'string' ? notes : JSON.stringify(notes, null, 2)}
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error parsing document notes:", error);
      // If there's an error parsing, just show the original notes
      return (
        <div>
          <div className="font-medium mb-1">Document Notes:</div>
          <div className="text-gray-600 whitespace-pre-wrap">
            {typeof notes === 'string' ? notes : JSON.stringify(notes, null, 2)}
          </div>
        </div>
      );
    }
  };
  
  // Check if this is a death certificate with processed data so we can render a special card format
  const isProcessedDeathCertificate = document.type === 'death_certificate' && 
                                     document.status === 'processed' && 
                                     document.notes;
  
  // Try to get the extracted data for death certificates (for the special format)
  let extractedDeathCertData: any = null;
  if (isProcessedDeathCertificate && document.notes) {
    try {
      const notesText = document.notes;
      const jsonMatch = notesText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        extractedDeathCertData = JSON.parse(jsonMatch[1]);
      }
    } catch (e) {
      console.error("Failed to parse death certificate data", e);
    }
  }
  
  // Render a special card for death certificates when we have extracted data
  if (isProcessedDeathCertificate && extractedDeathCertData && 
      (extractedDeathCertData.firstName || extractedDeathCertData.surname)) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 bg-white">
            <div className="flex items-start">
              <div className="w-14 h-16 bg-gray-100 rounded-sm overflow-hidden mr-4 flex-shrink-0 border">
                <img 
                  src={`/api/documents/${document.id}/thumbnail`} 
                  alt="Document thumbnail" 
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    // Fallback to file icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center"><FileText class="h-6 w-6 text-gray-500" /></div>`;
                    }
                  }}
                />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {`${extractedDeathCertData.firstName || ''} ${extractedDeathCertData.surname || ''}`}
                </h3>
                <div className="text-sm text-gray-600 mt-0.5 flex items-center flex-wrap">
                  <span>Death Certificate</span>
                  {document.fileSize && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{formatFileSize(document.fileSize)}</span>
                    </>
                  )}
                  {document.createdAt && (
                    <>
                      <span className="mx-2">•</span>
                      <span>Uploaded {new Date(document.createdAt).toLocaleDateString('en-GB')}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Processed
                </span>
                <div className="flex space-x-1">
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
          </div>
          
          {/* Certificate details in clean grid layout */}
          <div className="grid grid-cols-2 gap-y-4 text-sm border-t border-gray-200 p-4 bg-gray-50">
            {extractedDeathCertData.dateOfBirth && (
              <div className="col-span-1">
                <div className="text-gray-500">date of birth:</div>
                <div className="font-medium mt-1">
                  {new Date(extractedDeathCertData.dateOfBirth).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            )}
            
            {extractedDeathCertData.address && (
              <div className="col-span-1 row-span-2">
                <div className="text-gray-500">address:</div>
                <div className="font-medium mt-1">
                  {extractedDeathCertData.address.split(" ").slice(0, -1).join(" ").replace(/,\s*$/, "").split(' ').map((part: string, i: number, arr: string[]) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && i % 2 === 1 ? <br /> : ' '}
                    </React.Fragment>
                  ))}
                  <br />
                  {extractedDeathCertData.address.split(" ").slice(-1)}
                </div>
              </div>
            )}
            
            {extractedDeathCertData.dateOfDeath && (
              <div className="col-span-1">
                <div className="text-gray-500">date of death:</div>
                <div className="font-medium mt-1">
                  {new Date(extractedDeathCertData.dateOfDeath).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            )}
            
            {extractedDeathCertData.applicationNumber && (
              <div className="col-span-1">
                <div className="text-gray-500">application #:</div>
                <div className="font-medium mt-1">{extractedDeathCertData.applicationNumber}</div>
              </div>
            )}
          </div>
          
          {/* Alert dialog for deletion confirmation */}
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this Death Certificate? This action cannot be undone.
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
        </CardContent>
      </Card>
    );
  }
  
  // Regular document card for all other document types
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
            <h4 className="font-medium text-sm truncate">{document.filename || document.name}</h4>
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
              <a 
                href={document.status === 'processed' ? `/api/documents/${document.id}/view` : undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-500 hover:text-gray-900"
                  title="View Document"
                  disabled={document.status !== 'processed'}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </a>
              <a 
                href={document.status === 'processed' ? `/api/documents/${document.id}/download` : undefined}
                download
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-500 hover:text-gray-900"
                  title="Download Document"
                  disabled={document.status !== 'processed'}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </a>
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
                      Are you sure you want to delete "{document.filename || document.name}"? This action cannot be undone.
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
        {document.notes && document.status !== 'deleted' && !isProcessedDeathCertificate && (
          <div className="p-4 bg-gray-50 text-sm">
            {/* Try to parse the notes as JSON with extracted data */}
            {tryParseExtractedData(document.notes)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentCard;