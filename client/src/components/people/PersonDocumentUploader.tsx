import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProbateCase, Document } from '@shared/schema';

// Document types and their webhook endpoints (simplified version)
export const PERSON_DOCUMENT_TYPES = {
  'will': {
    name: 'Will',
    description: 'Extract executors and beneficiaries from Will',
    apiEndpoint: '/api/documents',
  },
  'death_certificate': {
    name: 'Death Certificate',
    description: 'Add deceased person to this case',
    apiEndpoint: '/api/documents',
  },
  'id_document': {
    name: 'ID Document',
    description: 'Extract details from passport or driving license',
    apiEndpoint: '/api/documents',
  },
  'bill': {
    name: 'Bill or Statement',
    description: 'Extract name and address details',
    apiEndpoint: '/api/documents',
  },
  'other': {
    name: 'Other Document',
    description: 'Upload any other document with person details',
    apiEndpoint: '/api/documents',
  },
};

// Schema for document upload
const documentUploadSchema = z.object({
  file: z.instanceof(FileList)
    .refine((files) => files.length > 0, "Please select a file")
    .transform(files => files[0]),
  description: z.string().optional(),
});

type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>;

interface PersonDocumentUploaderProps {
  documentType: keyof typeof PERSON_DOCUMENT_TYPES | null;
  onUploadComplete: (documentId: number) => void;
  onUploadError: (error: string) => void;
}

const PersonDocumentUploader: React.FC<PersonDocumentUploaderProps> = ({
  documentType,
  onUploadComplete,
  onUploadError
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();

  // Get the user's active case
  const { data: probateCases } = useQuery<ProbateCase[]>({
    queryKey: ['/api/probate-cases'],
    queryFn: async () => {
      const response = await fetch('/api/probate-cases', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch probate cases');
      }
      return response.json();
    }
  });

  // Get the active case ID (first case for now)
  const activeCaseId = probateCases && probateCases.length > 0 ? probateCases[0].id : undefined;

  const form = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadSchema),
  });

  const uploadMutation = useMutation({
    mutationFn: async (values: DocumentUploadFormValues) => {
      if (!documentType || !activeCaseId) {
        throw new Error('Document type or active case not available');
      }

      const formData = new FormData();
      formData.append('file', values.file);
      formData.append('type', documentType);
      formData.append('caseId', activeCaseId.toString());
      
      if (documentType === 'other' && values.description) {
        formData.append('description', values.description);
      }

      // Mark this document as being used for person extraction
      formData.append('metadata', JSON.stringify({
        usedForPersonExtraction: true,
        personDocumentType: documentType
      }));

      // Custom axios instance with upload progress tracking
      const response = await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      // Call the completion handler with the new document ID
      onUploadComplete(data.id);
      
      toast({
        title: "Upload successful",
        description: "The document has been uploaded and is being processed",
      });
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error uploading document';
      onUploadError(errorMessage);
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
      setUploadProgress(0);
    }
  });

  const onSubmit = (values: DocumentUploadFormValues) => {
    if (!activeCaseId) {
      toast({
        title: "No active case",
        description: "Please create a probate case first",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(values);
  };

  // If document type isn't selected, show a message
  if (!documentType) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please select a document type first
      </div>
    );
  }

  const docInfo = PERSON_DOCUMENT_TYPES[documentType];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">{docInfo.name}</h3>
          <p className="text-sm text-gray-500">{docInfo.description}</p>
        </div>

        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Upload File</FormLabel>
              <FormControl>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop or click to browse
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isUploading}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        onChange(files);
                      }
                    }}
                    {...rest}
                  />
                  <FormDescription className="text-xs">
                    Accepted formats: PDF, JPEG, PNG (max 10MB)
                  </FormDescription>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {documentType === 'other' && (
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the document (e.g., Power of Attorney)"
                    className="resize-none"
                    disabled={isUploading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Please provide details about this document to help with information extraction
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {isUploading && (
          <div className="mt-4">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-center mt-1">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-4">
          <Button type="submit" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload and Process"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PersonDocumentUploader;