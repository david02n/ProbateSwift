import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { apiRequest } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, UserPlus } from 'lucide-react';
import { Document } from '@shared/schema';

interface CreateFromDeathCertificateProps {
  caseId: number;
  userId: number;
}

export const CreateFromDeathCertificate: React.FC<CreateFromDeathCertificateProps> = ({ caseId, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all death certificate documents for this case
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    enabled: isOpen,
  });
  
  // Filter for death certificates only
  const deathCertificates = documents.filter(doc => doc.type === 'death_certificate');
  
  // Mutation to create a person from death certificate
  const createPersonMutation = useMutation({
    mutationFn: async (personData: any) => {
      const res = await apiRequest('POST', '/api/executors', personData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/executors'] });
      toast({
        title: 'Success',
        description: 'Deceased person created from death certificate',
      });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create person from death certificate',
        variant: 'destructive',
      });
    },
  });
  
  // Helper function to extract data from document notes
  const extractDataFromNotes = (document: Document) => {
    try {
      if (!document.notes) {
        toast({
          title: 'No data available',
          description: 'This document does not contain any extracted data',
          variant: 'destructive',
        });
        return null;
      }
      
      // Try to parse the notes as JSON
      const notesObj = JSON.parse(document.notes);
      
      // Check if there's a webhookResponse with content
      if (notesObj && notesObj.webhookResponse && notesObj.webhookResponse.content) {
        // Try to extract JSON from markdown code block
        const match = notesObj.webhookResponse.content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (match && match[1]) {
          return JSON.parse(match[1]);
        }
        
        // Try direct parsing of content if not in markdown format
        try {
          return JSON.parse(notesObj.webhookResponse.content);
        } catch (e) {
          console.error('Error parsing content as JSON:', e);
        }
      }
      
      return notesObj;
    } catch (error) {
      console.error('Error extracting data from notes:', error);
      toast({
        title: 'Data extraction failed',
        description: 'Unable to parse the document data',
        variant: 'destructive',
      });
      return null;
    }
  };
  
  // Handle document selection
  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    const data = extractDataFromNotes(document);
    setExtractedData(data);
  };
  
  // Handle person creation from extracted data
  const handleCreatePerson = () => {
    if (!selectedDocument || !extractedData) return;
    
    // Split first name if it contains multiple words
    let firstName = '';
    let middleNames = '';
    
    if (extractedData.firstName) {
      const nameParts = extractedData.firstName.trim().split(/\s+/);
      firstName = nameParts[0];
      if (nameParts.length > 1) {
        middleNames = nameParts.slice(1).join(' ');
      }
    }
    
    // Create person from extracted data
    createPersonMutation.mutate({
      caseId,
      userId,
      firstName: firstName || extractedData.firstName || 'Unknown',
      middleNames: middleNames,
      lastName: extractedData.surname || extractedData.lastName || 'Unknown',
      addressLine1: extractedData.address || '',
      city: extractedData.city || '',
      county: extractedData.county || '',
      postCode: extractedData.postcode || extractedData.postCode || '',
      isExecutor: false,
      isApplicant: false,
      isNotifying: false,
      needsMoreInfo: true,
      relationshipToDeceased: 'Deceased',
      documentId: selectedDocument.id,
    });
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2 border-dashed border-primary/50 hover:bg-primary/5" 
        onClick={() => setIsOpen(true)}
      >
        <FileText className="h-5 w-5 text-primary" />
        <span>Create from Death Certificate</span>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Create Person from Death Certificate</DialogTitle>
            <DialogDescription>
              Select a death certificate and create a deceased person record automatically using the extracted data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {deathCertificates.length === 0 ? (
              <div className="text-center p-4 bg-gray-50 rounded-md">
                <p>No death certificates found. Please upload a death certificate first.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <Label htmlFor="document">Select a Death Certificate</Label>
                  <div className="space-y-2">
                    {deathCertificates.map((doc) => (
                      <Card 
                        key={doc.id} 
                        className={`cursor-pointer ${selectedDocument?.id === doc.id ? 'border-primary' : ''}`}
                        onClick={() => handleDocumentSelect(doc)}
                      >
                        <CardHeader className="py-2 px-3">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-gray-600" />
                            <CardTitle className="text-sm">{doc.filename}</CardTitle>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
                
                {extractedData && (
                  <div className="mt-4">
                    <h3 className="font-medium text-md mb-2">Extracted Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Name:</span> {extractedData.firstName} {extractedData.surname || extractedData.lastName}
                        </div>
                        {extractedData.dateOfBirth && (
                          <div>
                            <span className="font-medium">Date of Birth:</span> {extractedData.dateOfBirth}
                          </div>
                        )}
                        {extractedData.dateOfDeath && (
                          <div>
                            <span className="font-medium">Date of Death:</span> {extractedData.dateOfDeath}
                          </div>
                        )}
                        {extractedData.address && (
                          <div>
                            <span className="font-medium">Address:</span> {extractedData.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button 
              disabled={!selectedDocument || !extractedData || createPersonMutation.isPending}
              onClick={handleCreatePerson}
              className="flex items-center gap-2"
            >
              {createPersonMutation.isPending && (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              Create Deceased Person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateFromDeathCertificate;