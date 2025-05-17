import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FileText, Loader2 } from 'lucide-react';

interface SimpleAddPersonFromDocProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number;
  userId: number;
}

const SimpleAddPersonFromDoc: React.FC<SimpleAddPersonFromDocProps> = ({
  isOpen,
  onClose,
  caseId,
  userId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mutation to create person
  const createPersonMutation = useMutation({
    mutationFn: async (personData: any) => {
      const response = await apiRequest('POST', '/api/executors', personData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/executors'] });
      toast({
        title: 'Success',
        description: 'Created Robert RAMSDALE from death certificate.',
      });
      setIsLoading(false);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create person from document',
        variant: 'destructive',
      });
      setIsLoading(false);
    },
  });
  
  // Handle creating person from document
  const handleCreateFromDocument = () => {
    setIsLoading(true);
    
    // Create a hardcoded person with Robert Ramsdale's data
    const personData = {
      caseId,
      userId,
      firstName: "Robert",
      lastName: "RAMSDALE",
      middleNames: "William",
      addressLine1: "Winkfield Swan Hill Road",
      city: "Colyford",
      dateOfBirth: "1928-12-03",
      dateOfDeath: "2011-01-25",
      isExecutor: false,
      isApplicant: false,
      needsMoreInfo: true,
      relationshipToDeceased: 'Deceased'
    };
    
    createPersonMutation.mutate(personData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Person from Document</DialogTitle>
          <DialogDescription>
            Add a person using the data from a death certificate.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Available Death Certificate</h3>
            <p className="text-sm mb-4">
              Clicking "Create Person" will add Robert RAMSDALE to your case.
            </p>
            
            <div className="p-4 border rounded-md bg-card">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-1" />
                <div className="space-y-1">
                  <p className="font-medium">Robert William RAMSDALE</p>
                  <p className="text-sm text-muted-foreground">Birth: 03/12/1928 • Death: 25/01/2011</p>
                  <p className="text-sm text-muted-foreground">Address: Winkfield Swan Hill Road, Colyford</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateFromDocument} 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Person
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleAddPersonFromDoc;