import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Document } from '@shared/schema';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, FileIcon } from 'lucide-react';

interface ExistingDocumentSelectorProps {
  documentType: string | null;
  onDocumentSelect: (documentId: number) => void;
}

const ExistingDocumentSelector: React.FC<ExistingDocumentSelectorProps> = ({ 
  documentType,
  onDocumentSelect 
}) => {
  // Fetch documents of the specified type
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', documentType],
    queryFn: async () => {
      if (!documentType) return [];
      
      const response = await fetch(`/api/documents?type=${documentType}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      return response.json();
    },
    enabled: !!documentType,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  // Display message if no documents of this type are found
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-3 text-gray-500 text-sm">
        No {documentType?.replace('_', ' ')} documents found. Please upload a new document.
      </div>
    );
  }

  return (
    <Select onValueChange={(value) => onDocumentSelect(parseInt(value))}>
      <SelectTrigger>
        <SelectValue placeholder="Select a document" />
      </SelectTrigger>
      <SelectContent>
        {documents.map((doc) => (
          <SelectItem key={doc.id} value={doc.id.toString()}>
            <div className="flex items-center">
              <FileIcon className="h-4 w-4 mr-2 text-primary" />
              {doc.filename}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ExistingDocumentSelector;