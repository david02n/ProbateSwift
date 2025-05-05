import React, { useState } from 'react';
import { useLocation } from 'wouter';
import NewHeader from '@/components/layout/NewHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  User, 
  Scroll, 
  Home, 
  Wallet, 
  FileCog,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpecializedDocumentUploader from '@/components/documents/SpecializedDocumentUploader';

const DocumentUploadPage: React.FC = () => {
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('death_certificate');
  
  const handleBackClick = () => {
    setLocation('/documents');
  };
  
  const documentTypeIcons = {
    death_certificate: <FileText className="h-5 w-5" />,
    id_document: <User className="h-5 w-5" />,
    will: <Scroll className="h-5 w-5" />,
    property: <Home className="h-5 w-5" />,
    financial: <Wallet className="h-5 w-5" />,
    tax: <FileCog className="h-5 w-5" />,
    general: <FileText className="h-5 w-5" />,
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NewHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackClick}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
            <div>
              <h1 className="text-2xl font-bold mb-2">Upload Document</h1>
              <p className="text-gray-600">
                Choose a document type and upload your file
              </p>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>
                Select the type of document you want to upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue="death_certificate" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 lg:grid-cols-7 mb-8">
                  <TabsTrigger value="death_certificate" className="flex flex-col py-3 h-auto">
                    <FileText className="h-5 w-5 mb-1" />
                    <span className="text-xs">Death Cert</span>
                  </TabsTrigger>
                  <TabsTrigger value="id_document" className="flex flex-col py-3 h-auto">
                    <User className="h-5 w-5 mb-1" />
                    <span className="text-xs">ID Doc</span>
                  </TabsTrigger>
                  <TabsTrigger value="will" className="flex flex-col py-3 h-auto">
                    <Scroll className="h-5 w-5 mb-1" />
                    <span className="text-xs">Will</span>
                  </TabsTrigger>
                  <TabsTrigger value="property" className="flex flex-col py-3 h-auto">
                    <Home className="h-5 w-5 mb-1" />
                    <span className="text-xs">Property</span>
                  </TabsTrigger>
                  <TabsTrigger value="financial" className="flex flex-col py-3 h-auto">
                    <Wallet className="h-5 w-5 mb-1" />
                    <span className="text-xs">Financial</span>
                  </TabsTrigger>
                  <TabsTrigger value="tax" className="flex flex-col py-3 h-auto">
                    <FileCog className="h-5 w-5 mb-1" />
                    <span className="text-xs">Tax</span>
                  </TabsTrigger>
                  <TabsTrigger value="general" className="flex flex-col py-3 h-auto">
                    <FileText className="h-5 w-5 mb-1" />
                    <span className="text-xs">Other</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="death_certificate">
                  <SpecializedDocumentUploader 
                    documentType="death_certificate" 
                  />
                </TabsContent>
                
                <TabsContent value="id_document">
                  <SpecializedDocumentUploader 
                    documentType="id_document" 
                  />
                </TabsContent>
                
                <TabsContent value="will">
                  <SpecializedDocumentUploader 
                    documentType="will" 
                  />
                </TabsContent>
                
                <TabsContent value="property">
                  <SpecializedDocumentUploader 
                    documentType="property" 
                  />
                </TabsContent>
                
                <TabsContent value="financial">
                  <SpecializedDocumentUploader 
                    documentType="financial" 
                  />
                </TabsContent>
                
                <TabsContent value="tax">
                  <SpecializedDocumentUploader 
                    documentType="tax" 
                  />
                </TabsContent>
                
                <TabsContent value="general">
                  <SpecializedDocumentUploader 
                    documentType="general" 
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DocumentUploadPage;