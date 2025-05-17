import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Upload, CheckCircle, AlertCircle, User, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { ProbateCase } from '@shared/schema';

// Document types and their corresponding webhook endpoints
const DOCUMENT_TYPES = {
  death_certificate: {
    name: 'Death Certificate',
    description: 'The official death certificate issued by the registry office',
    webhookEndpoint: 'https://n8n.probateswift.com/webhook/fileupload-dc',
  },
  id_document: {
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

// Schema for general document upload form
const generalDocumentSchema = z.object({
  file: z.any().refine((files) => files instanceof FileList && files.length === 1, 'Please select a file'),
  subject: z.string().min(1, 'Please enter a document subject'),
  usage: z.string().min(1, 'Please describe what this document will be used for'),
});

// Schema for specific document upload form
const specificDocumentSchema = z.object({
  file: z.any().refine((files) => files instanceof FileList && files.length === 1, 'Please select a file'),
});

interface SpecializedDocumentUploaderProps {
  documentType: keyof typeof DOCUMENT_TYPES;
  onUploadComplete?: () => void;
}

const SpecializedDocumentUploader: React.FC<SpecializedDocumentUploaderProps> = ({ 
  documentType, 
  onUploadComplete 
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<number | null>(null);
  const [createPersonRecord, setCreatePersonRecord] = useState(false);
  
  // Get the document type info
  const docInfo = DOCUMENT_TYPES[documentType];
  const isGeneralDocument = documentType === 'general';
  
  // Determine if this document type can be associated with a person
  const isPersonRelatedDocument = documentType === 'death_certificate' || 
                                 documentType === 'id_document' || 
                                 documentType === 'will';
  
  // Get the user's active case
  const { data: probateCases, isLoading: isLoadingCases } = useQuery<ProbateCase[]>({
    queryKey: ['/api/probate-cases'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });
  
  // Get the active case ID (first case for now)
  const activeCaseId = probateCases && probateCases.length > 0 ? probateCases[0].id : undefined;
  
  // Define form types for TypeScript type safety
  type GeneralDocumentForm = {
    file: FileList | undefined;
    subject: string;
    usage: string;
  };
  
  type SpecificDocumentForm = {
    file: FileList | undefined;
  };
  
  // Type guard to check if values is a GeneralDocumentForm
  function isGeneralDocumentForm(values: any): values is GeneralDocumentForm {
    return 'subject' in values && 'usage' in values;
  }
  
  // Initialize form based on document type
  const form = useForm<GeneralDocumentForm | SpecificDocumentForm>({
    resolver: zodResolver(isGeneralDocument ? generalDocumentSchema : specificDocumentSchema),
    defaultValues: isGeneralDocument 
      ? { file: undefined, subject: '', usage: '' } 
      : { file: undefined },
  });
  
  // Document upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      const res = await apiRequest('POST', '/api/documents/upload', formData);
      
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setUploadedDocumentId(data.documentId);
      setUploadProgress(100);
      
      toast({
        title: 'Document uploaded',
        description: `Your ${docInfo.name.toLowerCase()} has been successfully uploaded`,
        variant: 'default',
      });
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });
  
  // Form submission handler
  const onSubmit = (values: GeneralDocumentForm | SpecificDocumentForm) => {
    if (!activeCaseId) {
      toast({
        title: 'No probate case',
        description: 'Please create a probate case first',
        variant: 'destructive',
      });
      return;
    }
    
    const fileInput = form.getValues('file') as FileList | undefined;
    if (!fileInput || fileInput.length === 0) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }
    
    const file = fileInput[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', activeCaseId.toString());
    formData.append('category', documentType);
    
    // Add additional fields for general documents
    if (isGeneralDocument && isGeneralDocumentForm(values)) {
      formData.append('subject', values.subject);
      formData.append('usage', values.usage);
    }
    
    // Add the create person flag if selected
    if (isPersonRelatedDocument) {
      formData.append('createPersonRecord', createPersonRecord.toString());
    }
    
    // Add webhook endpoint information
    formData.append('webhookUrl', docInfo.webhookEndpoint);
    
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress < 90 ? newProgress : 90;
      });
    }, 300);
    
    // Upload the document
    uploadMutation.mutate(formData);
    
    // Clear the interval when upload completes or fails
    setTimeout(() => clearInterval(interval), 5000);
  };
  
  // Reset form
  const handleReset = () => {
    form.reset();
    setUploadedDocumentId(null);
    setUploadProgress(0);
  };
  
  if (isLoadingCases) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!activeCaseId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Probate Case Found</h3>
            <p className="text-gray-500 mb-4">
              You need to create a probate case before uploading documents.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{docInfo.name}</CardTitle>
        <CardDescription>{docInfo.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {uploadedDocumentId ? (
          <div className="py-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Successful</h3>
            <p className="text-gray-500 mb-4">
              Your document has been successfully uploaded and is being processed.
            </p>
            <Button onClick={handleReset}>Upload Another</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Select File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        {...field}
                        onChange={(e) => {
                          onChange(e.target.files);
                        }}
                        disabled={isUploading}
                        accept="image/jpeg,image/png,application/pdf"
                      />
                    </FormControl>
                    <FormDescription>
                      Accepted file types: JPG, PNG, PDF
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Toggle switch for person-related documents */}
              {isPersonRelatedDocument && (
                <div className="flex items-center space-x-2 py-4 border-t border-b border-gray-100">
                  <Switch
                    id="create-person-record"
                    checked={createPersonRecord}
                    onCheckedChange={setCreatePersonRecord}
                    disabled={isUploading}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="create-person-record"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                    >
                      <UserPlus className="h-4 w-4 mr-2 text-primary" />
                      Create a person record from this document
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {documentType === 'death_certificate' 
                        ? "Extract deceased's details and create a person record"
                        : documentType === 'id_document'
                        ? "Extract individual's details and create a person record"
                        : "Create an executor/beneficiary record from this document"}
                    </p>
                  </div>
                </div>
              )}

              {isGeneralDocument && (
                <>
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Subject</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter the document subject" 
                            {...field} 
                            disabled={isUploading}
                          />
                        </FormControl>
                        <FormDescription>
                          Briefly describe what this document is
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="usage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intended Use</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what this document will be used for" 
                            {...field} 
                            disabled={isUploading}
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Explain how you intend to use this document in the probate process
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default SpecializedDocumentUploader;