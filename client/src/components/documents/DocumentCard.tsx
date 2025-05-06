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
  ChevronsUpDown,
  Plus,
  Minus,
  Check
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
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
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

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
  const [includeInEstate, setIncludeInEstate] = useState(false);
  const [isAddingToEstate, setIsAddingToEstate] = useState(false);
  
  // For API error handling
  const [apiError, setApiError] = useState<string | null>(null);
  
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
  
  // Handle adding financial document to estate
  const queryClient = useQueryClient();
  const handleAddToEstate = async (isAsset: boolean) => {
    if (!extractedData || isAddingToEstate) return;
    
    setIsAddingToEstate(true);
    try {
      // Prepare data based on classification
      const itemData = {
        caseId: 1, // Assuming case ID 1 for now
        name: extractedData.accountType || 'Financial Item',
        description: `From document: ${document.name || document.filename}`,
        value: extractedData.balance || 0,
        notes: JSON.stringify(extractedData),
        institution: extractedData.institutionName || 'Unknown',
        accountHolder: extractedData.accountHolder || '',
        accountNumber: extractedData.accountNumber || '',
        documentId: document.id
      };
      
      let endpoint = isAsset ? '/api/estate/assets' : '/api/estate/liabilities';
      
      const response = await apiRequest('POST', endpoint, itemData);
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: `${isAsset ? 'Asset' : 'Liability'} added`,
          description: `Document has been added to the estate as ${isAsset ? 'an asset' : 'a liability'}.`,
        });
        // Invalidate the assets or liabilities query to refresh the list
        queryClient.invalidateQueries({ queryKey: [isAsset ? '/api/estate/assets' : '/api/estate/liabilities'] });
      } else {
        throw new Error(result.message || 'An error occurred');
      }
    } catch (error) {
      console.error("Error adding to estate:", error);
      toast({
        title: 'Error',
        description: 'Failed to add document to estate',
        variant: 'destructive',
      });
    } finally {
      setIsAddingToEstate(false);
      setIncludeInEstate(true); // Mark as included
    }
  };
  
  // Check if document has extractable data
  const hasExtractableData = document.notes && document.status === 'processed';
  
  // Extract document data for display
  let extractedData: any = null;
  if (hasExtractableData && document.notes) {
    try {
      console.log("Processing document notes:", document.notes);
      
      // First try to parse the notes as direct JSON
      try {
        // Try parsing the entire document.notes as JSON
        const parsedNotes = JSON.parse(document.notes);
        
        // Check if it's an array with content property (common webhook response format)
        if (Array.isArray(parsedNotes) && parsedNotes[0] && parsedNotes[0].content) {
          const content = parsedNotes[0].content;
          
          // Check if content contains a JSON code block
          if (content.includes('```json')) {
            const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch && jsonMatch[1]) {
              extractedData = JSON.parse(jsonMatch[1]);
              console.log("Extracted data from array with JSON code block:", extractedData);
            }
          }
        } 
        // Check if it has webhookResponse (another common format)
        else if (parsedNotes.webhookResponse && parsedNotes.webhookResponse.content) {
          const content = parsedNotes.webhookResponse.content;
          if (content.includes('```json')) {
            const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch && jsonMatch[1]) {
              extractedData = JSON.parse(jsonMatch[1]);
              console.log("Extracted data from webhookResponse:", extractedData);
            }
          }
        }
        // If parsed JSON is already the data we want
        else if (parsedNotes.type && (parsedNotes.firstName || parsedNotes.surname)) {
          extractedData = parsedNotes;
          console.log("Notes were already valid structured data:", extractedData);
        }
      } catch (e) {
        console.log("Notes are not directly valid JSON, trying other parsing methods");
      }
      
      // If we still don't have data, try direct code block extraction
      if (!extractedData && typeof document.notes === 'string') {
        // Check for JSON code blocks
        if (document.notes.includes('```json')) {
          console.log("Found JSON code block in string notes");
          const jsonMatch = document.notes.match(/```json\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              extractedData = JSON.parse(jsonMatch[1]);
              console.log("Extracted data from direct JSON code block:", extractedData);
            } catch (e) {
              console.error("Failed to parse JSON from code block:", e);
            }
          }
        }
        // Check if it might be escaped JSON
        else if (document.notes.includes('"type"')) {
          try {
            // Try to find a JSON-like structure by looking for opening and closing braces
            const jsonCandidate = document.notes.replace(/\\"/g, '"').match(/\{[\s\S]*\}/);
            if (jsonCandidate) {
              extractedData = JSON.parse(jsonCandidate[0]);
              console.log("Extracted data from potential JSON structure:", extractedData);
            }
          } catch (e) {
            console.error("Failed to parse potential JSON structure:", e);
          }
        }
      }
    } catch (e) {
      console.error("Error extracting document data:", e);
    }
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <div className="flex">
            <div className={`h-10 w-10 rounded-md ${getStatusColorClass()} flex items-center justify-center mr-3 flex-shrink-0`}>
              {getStatusIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium truncate pr-2">{document.name || document.filename}</h4>
              <div className="text-xs text-gray-500 flex items-center flex-wrap gap-x-2">
                <span>{formatDocumentType(document.type)}</span>
                {document.fileSize && <span>• {formatFileSize(document.fileSize)}</span>}
                {document.createdAt && <span>• Uploaded {new Date(document.createdAt).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
          
          {/* Status badge and actions */}
          <div className="flex items-center flex-shrink-0">
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
                <div className="bg-gray-50 rounded-md p-4 overflow-x-auto">
                  <div className="grid grid-cols-1 gap-4 min-w-[250px]">
                    {/* Document Type */}
                    <div className="flex flex-col space-y-1">
                      <div className="text-xs text-gray-500">Type</div>
                      <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                        <div className="font-medium break-words pr-2 max-w-[80%]">
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
                            <span>Copy</span>
                        </Button>
                      </div>
                    </div>

                    {/* ======== COMMON FIELDS ACROSS DOCUMENT TYPES ======== */}
                    
                    {/* Name Fields */}
                    {(extractedData.firstName || extractedData.surname) && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Full Name</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
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
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Testator Name (Will) */}
                    {extractedData.testatorName && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Testator</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.testatorName}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.testatorName, 
                              'Testator Name'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Account Holder (Financial) */}
                    {extractedData.accountHolder && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Account Holder</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.accountHolder}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.accountHolder, 
                              'Account Holder'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Owner Name (Property) */}
                    {extractedData.ownerName && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Owner</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.ownerName}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.ownerName, 
                              'Owner Name'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Taxpayer Name (Tax) */}
                    {extractedData.taxpayerName && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Taxpayer</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.taxpayerName}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.taxpayerName, 
                              'Taxpayer Name'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Date of Birth */}
                    {extractedData.dateOfBirth && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Date of Birth</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
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
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Date of Death */}
                    {extractedData.dateOfDeath && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Date of Death</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
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
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Date of Will */}
                    {extractedData.dateOfWill && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Date of Will</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {new Date(extractedData.dateOfWill).toLocaleDateString('en-GB')}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              new Date(extractedData.dateOfWill).toLocaleDateString('en-GB'), 
                              'Date of Will'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Valuation Date */}
                    {extractedData.valuationDate && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Valuation Date</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {new Date(extractedData.valuationDate).toLocaleDateString('en-GB')}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              new Date(extractedData.valuationDate).toLocaleDateString('en-GB'), 
                              'Valuation Date'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Statement Date */}
                    {extractedData.statementDate && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Statement Date</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {new Date(extractedData.statementDate).toLocaleDateString('en-GB')}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              new Date(extractedData.statementDate).toLocaleDateString('en-GB'), 
                              'Statement Date'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Submission Date */}
                    {extractedData.submissionDate && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Submission Date</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {new Date(extractedData.submissionDate).toLocaleDateString('en-GB')}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              new Date(extractedData.submissionDate).toLocaleDateString('en-GB'), 
                              'Submission Date'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Expiry Date */}
                    {extractedData.expiryDate && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Expiry Date</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {new Date(extractedData.expiryDate).toLocaleDateString('en-GB')}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              new Date(extractedData.expiryDate).toLocaleDateString('en-GB'), 
                              'Expiry Date'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Address */}
                    {extractedData.address && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Address</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
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
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Property Address */}
                    {extractedData.propertyAddress && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Property Address</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.propertyAddress}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.propertyAddress, 
                              'Property Address'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Application Number */}
                    {extractedData.applicationNumber && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Application Number</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
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
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Document Number */}
                    {extractedData.documentNumber && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Document Number</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.documentNumber}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.documentNumber, 
                              'Document Number'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Document Type */}
                    {extractedData.documentType && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Document Type</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.documentType}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.documentType, 
                              'Document Type'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Issuing Country */}
                    {extractedData.issuingCountry && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Issuing Country</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.issuingCountry}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.issuingCountry, 
                              'Issuing Country'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Institution Name */}
                    {extractedData.institutionName && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Institution</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.institutionName}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.institutionName, 
                              'Institution'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Account Number */}
                    {extractedData.accountNumber && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Account Number</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.accountNumber}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.accountNumber, 
                              'Account Number'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Account Type */}
                    {extractedData.accountType && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Account Type</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.accountType}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.accountType, 
                              'Account Type'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Land Registry Number */}
                    {extractedData.landRegistryNumber && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Land Registry Number</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.landRegistryNumber}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.landRegistryNumber, 
                              'Land Registry Number'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Tax Year */}
                    {extractedData.taxYear && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Tax Year</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.taxYear}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.taxYear, 
                              'Tax Year'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Reference Number */}
                    {extractedData.referenceNumber && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Reference Number</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.referenceNumber}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.referenceNumber, 
                              'Reference Number'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Currency */}
                    {extractedData.currency && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Currency</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.currency}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.currency, 
                              'Currency'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Numeric values */}
                    {extractedData.balance !== undefined && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Balance</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {typeof extractedData.balance === 'number' 
                              ? new Intl.NumberFormat('en-GB', { 
                                  style: 'currency', 
                                  currency: extractedData.currency || 'GBP' 
                                }).format(extractedData.balance)
                              : extractedData.balance
                            }
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              String(extractedData.balance), 
                              'Balance'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Classification and Add to Estate Option (for financial documents) */}
                    {extractedData.balance !== undefined && extractedData.classification && (
                      <div className="flex flex-col space-y-1 border-t border-gray-200 pt-3 mt-3">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-sm font-medium">Classification: </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${extractedData.classification.toLowerCase() === 'asset' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {extractedData.classification}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Include in estate valuation</span>
                            <Switch 
                              checked={includeInEstate} 
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  const isAsset = extractedData.classification.toLowerCase() === 'asset';
                                  handleAddToEstate(isAsset);
                                } else {
                                  setIncludeInEstate(false);
                                }
                              }}
                              disabled={isAddingToEstate || includeInEstate}
                            />
                          </div>
                        </div>
                        {isAddingToEstate && (
                          <div className="flex items-center justify-center space-x-2 py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-gray-600">Adding to estate...</span>
                          </div>
                        )}
                        {includeInEstate && !isAddingToEstate && (
                          <div className="flex items-center justify-center py-2 text-green-600">
                            <Check className="h-4 w-4 mr-2" />
                            <span className="text-sm">
                              Added to estate as {extractedData.classification.toLowerCase() === 'asset' ? 'asset' : 'liability'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {extractedData.estimatedValue !== undefined && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Estimated Value</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {typeof extractedData.estimatedValue === 'number' 
                              ? new Intl.NumberFormat('en-GB', { 
                                  style: 'currency', 
                                  currency: 'GBP' 
                                }).format(extractedData.estimatedValue)
                              : extractedData.estimatedValue
                            }
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              String(extractedData.estimatedValue), 
                              'Estimated Value'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {extractedData.totalTaxDue !== undefined && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Total Tax Due</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {typeof extractedData.totalTaxDue === 'number' 
                              ? new Intl.NumberFormat('en-GB', { 
                                  style: 'currency', 
                                  currency: 'GBP' 
                                }).format(extractedData.totalTaxDue)
                              : extractedData.totalTaxDue
                            }
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              String(extractedData.totalTaxDue), 
                              'Total Tax Due'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Array fields */}
                    {extractedData.beneficiaries && extractedData.beneficiaries.length > 0 && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Beneficiaries</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.beneficiaries.join(', ')}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.beneficiaries.join(', '), 
                              'Beneficiaries'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {extractedData.executors && extractedData.executors.length > 0 && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Executors</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.executors.join(', ')}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.executors.join(', '), 
                              'Executors'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {extractedData.witnesses && extractedData.witnesses.length > 0 && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Witnesses</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.witnesses.join(', ')}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.witnesses.join(', '), 
                              'Witnesses'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {extractedData.codicilDates && extractedData.codicilDates.length > 0 && (
                      <div className="flex flex-col space-y-1">
                        <div className="text-xs text-gray-500">Codicil Dates</div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {extractedData.codicilDates.map((date: string) => 
                              new Date(date).toLocaleDateString('en-GB')
                            ).join(', ')}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(
                              extractedData.codicilDates.map((date: string) => 
                                new Date(date).toLocaleDateString('en-GB')
                              ).join(', '), 
                              'Codicil Dates'
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Any remaining fields not explicitly handled */}
                    {Object.entries(extractedData).filter(([key]) => 
                      ![
                        'type', 'firstName', 'surname', 'dateOfBirth', 'dateOfDeath', 'address', 
                        'applicationNumber', 'documentNumber', 'expiryDate', 'documentType', 'issuingCountry',
                        'testatorName', 'dateOfWill', 'beneficiaries', 'executors', 'codicilDates', 'witnesses',
                        'ownerName', 'propertyAddress', 'estimatedValue', 'valuationDate', 'landRegistryNumber',
                        'accountHolder', 'institutionName', 'accountNumber', 'balance', 'statementDate', 'currency', 'accountType',
                        'taxpayerName', 'taxYear', 'totalTaxDue', 'referenceNumber', 'submissionDate'
                      ].includes(key)
                    ).map(([key, value]) => (
                      <div key={key} className={`flex flex-col space-y-1 ${typeof value === 'string' && value.length > 30 ? 'col-span-2' : ''}`}>
                        <div className="text-xs text-gray-500">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                          <div className="font-medium break-words pr-2 max-w-[80%]">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => copyToClipboard(
                              Array.isArray(value) ? value.join(', ') : String(value), 
                              key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                            )}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
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
                      <div className="flex items-center justify-between flex-wrap gap-y-1 w-full">
                        <div className="font-medium break-words pr-2 max-w-[80%]">
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
                            <span>Copy</span>
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