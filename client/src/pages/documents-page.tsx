import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import NewHeader from "@/components/layout/NewHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Upload, 
  File, 
  FilePlus2,
  FileCheck,
  FileX,
  Download,
  Search,
  Trash2,
  Eye,
  Loader2,
  FileUp
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentUploader from "@/components/documents/DocumentUploader";
import DocumentCard from "@/components/documents/DocumentCard";
import { useToast } from "@/hooks/use-toast";
import { DocumentAnalysisResult } from "@/lib/documentService";

const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Define interfaces for documents and cases
  interface Document {
    id: number;
    caseId: number;
    userId: number;
    filename: string;
    type: string;
    status: string;
    storagePath: string;
    fileSize: number;
    fileType: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }

  interface Case {
    id: number;
    userId: number;
    deceasedName: string;
    deceasedDateOfDeath?: Date;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
  }

  // Store documents from the API
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  
  // Get the user's cases to find the default case
  const { data: cases, isLoading: isLoadingCases } = useQuery<Case[]>({ 
    queryKey: ['/api/probate-cases'],
    enabled: !!user,
  });
  
  // Get the default case ID (use the first one for now)
  const defaultCaseId = cases && cases.length > 0 ? cases[0].id : null;
  
  // Get documents for the default case
  const { 
    data: documentsData, 
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments 
  } = useQuery<Document[]>({
    queryKey: ['/api/documents', defaultCaseId],
    enabled: !!defaultCaseId,
  });
  
  // Update local documents state when API data changes
  useEffect(() => {
    if (documentsData) {
      setDocuments(documentsData);
    }
  }, [documentsData]);
  
  // Connect to WebSocket for real-time document updates
  useEffect(() => {
    if (!defaultCaseId) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.addEventListener('open', () => {
      console.log('WebSocket connected');
    });
    
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'DOCUMENT_UPDATE') {
          console.log('Document update received:', data);
          
          // Refresh documents after an update
          refetchDocuments();
          
          // Show a toast notification
          toast({
            title: `Document ${data.status}`,
            description: `Document ID ${data.documentId} has been ${data.status}`,
            variant: data.status === 'error' ? 'destructive' : 'default',
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    socket.addEventListener('close', () => {
      console.log('WebSocket disconnected');
    });
    
    return () => {
      socket.close();
    };
  }, [defaultCaseId, refetchDocuments, toast]);
  
  const documentCategories = [
    { 
      id: "identification", 
      name: "Identification", 
      description: "ID, passport, proof of address", 
      icon: <FileText className="h-5 w-5" /> 
    },
    { 
      id: "death_certificate", 
      name: "Death Certificate",
      description: "Official death certificate", 
      icon: <FileCheck className="h-5 w-5" /> 
    },
    { 
      id: "will", 
      name: "Will & Codicils", 
      description: "Original will and amendments", 
      icon: <FileText className="h-5 w-5" /> 
    },
    { 
      id: "property", 
      name: "Property Documents", 
      description: "Title deeds, valuations", 
      icon: <FileText className="h-5 w-5" /> 
    },
    { 
      id: "financial", 
      name: "Financial Documents", 
      description: "Bank statements, investments", 
      icon: <FileText className="h-5 w-5" /> 
    },
    { 
      id: "tax", 
      name: "Tax Documents", 
      description: "Tax returns, IHT forms", 
      icon: <FileText className="h-5 w-5" /> 
    }
  ];
  
  // Start the upload process for a specific category
  const handleStartUpload = (category?: string) => {
    setSelectedCategory(category || null);
    setShowUploader(true);
  };
  
  // Handle document upload completion
  const handleUploadComplete = (result: DocumentAnalysisResult) => {
    toast({
      title: "Document processed",
      description: `Document was successfully processed as ${result.documentType}`,
    });
    
    // Refresh documents
    refetchDocuments();
    
    // Close uploader
    setShowUploader(false);
  };
  
  // Handle document upload error
  const handleUploadError = (error: string) => {
    toast({
      title: "Upload failed",
      description: error,
      variant: "destructive",
    });
  };
  
  // Handle document deletion
  const handleDeleteDocument = (documentId: number) => {
    toast({
      title: "Document deleted",
      description: "The document has been removed from your case",
    });
    
    // Refresh documents after deletion
    refetchDocuments();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NewHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Documents</h1>
            <p className="text-gray-600">
              Upload and manage important documents for your probate application
            </p>
          </div>
          
          <Tabs defaultValue="all" className="mb-8">
            <TabsList>
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="required">Required Documents</TabsTrigger>
              <TabsTrigger value="uploaded">Uploaded</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="pt-4">
              {/* Main Upload Area */}
              <Card className="mb-8">
                <CardContent className="p-6">
                  {showUploader ? (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">
                          {selectedCategory ? `Upload ${documentCategories.find(c => c.id === selectedCategory)?.name}` : 'Upload Document'}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowUploader(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                      
                      {defaultCaseId ? (
                        <DocumentUploader
                          caseId={defaultCaseId}
                          category={selectedCategory || undefined}
                          onUploadComplete={handleUploadComplete}
                          onUploadError={handleUploadError}
                        />
                      ) : (
                        <div className="text-center p-6">
                          <p className="text-gray-500">You need to create a probate case before uploading documents.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => handleStartUpload()}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Drag & Drop Files</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Upload PDFs, images, or document files (max 10MB)
                      </p>
                      
                      <Button 
                        className="bg-[#002B49] hover:bg-[#002B49]/90"
                      >
                        Choose File to Upload
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Specialized Document Upload Button */}
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline"
                  className="gap-2"
                  onClick={() => setLocation('/document-upload')}
                >
                  <FileUp className="h-4 w-4" />
                  Use Specialized Document Uploader
                </Button>
              </div>
              
              {/* Document Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {documentCategories.map((category) => (
                  <Card key={category.id} className="hover:shadow-md transition cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-center mb-2">
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mr-3">
                          {category.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <p className="text-xs text-gray-500">{category.description}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => handleStartUpload(category.id)}
                      >
                        Upload
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Document List */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Documents</CardTitle>
                  <CardDescription>
                    Documents you've uploaded for your probate application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDocuments ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : documents && documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <DocumentCard 
                          key={doc.id} 
                          document={doc} 
                          onDelete={handleDeleteDocument}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Documents Yet</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Documents you upload will appear here. Start by uploading required documents for your probate application.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => handleStartUpload()}
                      >
                        Upload Your First Document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="required" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                  <CardDescription>
                    Documents needed for your probate application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDocuments ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Death Certificate */}
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div className="flex">
                            <div className={`h-10 w-10 rounded-md ${documents?.some(doc => doc.type === 'death_certificate') ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center mr-3`}>
                              {documents?.some(doc => doc.type === 'death_certificate') ? <FileCheck className="h-5 w-5" /> : <FileX className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="font-medium">Death Certificate</h4>
                              <p className="text-sm text-gray-500">Required for probate application</p>
                            </div>
                          </div>
                          <span className={`text-xs ${documents?.some(doc => doc.type === 'death_certificate') ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'} px-2.5 py-0.5 rounded-full h-fit`}>
                            {documents?.some(doc => doc.type === 'death_certificate') ? 'Uploaded' : 'Not Uploaded'}
                          </span>
                        </div>
                        {!documents?.some(doc => doc.type === 'death_certificate') && (
                          <div className="mt-3 ml-13">
                            <Button 
                              size="sm"
                              className="bg-[#002B49] hover:bg-[#002B49]/90"
                              onClick={() => handleStartUpload('death_certificate')}
                            >
                              Upload
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Will Document */}
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div className="flex">
                            <div className={`h-10 w-10 rounded-md ${documents?.some(doc => doc.type === 'will') ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center mr-3`}>
                              {documents?.some(doc => doc.type === 'will') ? <FileCheck className="h-5 w-5" /> : <FileX className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="font-medium">Will</h4>
                              <p className="text-sm text-gray-500">Original will and any codicils</p>
                            </div>
                          </div>
                          <span className={`text-xs ${documents?.some(doc => doc.type === 'will') ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'} px-2.5 py-0.5 rounded-full h-fit`}>
                            {documents?.some(doc => doc.type === 'will') ? 'Uploaded' : 'Not Uploaded'}
                          </span>
                        </div>
                        {!documents?.some(doc => doc.type === 'will') && (
                          <div className="mt-3 ml-13">
                            <Button 
                              size="sm"
                              className="bg-[#002B49] hover:bg-[#002B49]/90"
                              onClick={() => handleStartUpload('will')}
                            >
                              Upload
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* ID Verification */}
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div className="flex">
                            <div className={`h-10 w-10 rounded-md ${documents?.some(doc => doc.type === 'identification') ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center mr-3`}>
                              {documents?.some(doc => doc.type === 'identification') ? <FileCheck className="h-5 w-5" /> : <FileX className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="font-medium">ID Verification</h4>
                              <p className="text-sm text-gray-500">Passport or driving license</p>
                            </div>
                          </div>
                          <span className={`text-xs ${documents?.some(doc => doc.type === 'identification') ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'} px-2.5 py-0.5 rounded-full h-fit`}>
                            {documents?.some(doc => doc.type === 'identification') ? 'Uploaded' : 'Not Uploaded'}
                          </span>
                        </div>
                        {!documents?.some(doc => doc.type === 'identification') && (
                          <div className="mt-3 ml-13">
                            <Button 
                              size="sm"
                              className="bg-[#002B49] hover:bg-[#002B49]/90"
                              onClick={() => handleStartUpload('identification')}
                            >
                              Upload
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="uploaded" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Documents</CardTitle>
                  <CardDescription>
                    Successfully uploaded documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDocuments ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : documents?.filter(doc => doc.status === 'processed').length > 0 ? (
                    <div className="space-y-4">
                      {documents.filter(doc => doc.status === 'processed').map((doc) => (
                        <DocumentCard 
                          key={doc.id} 
                          document={doc} 
                          onDelete={handleDeleteDocument}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Uploaded Documents</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        All successfully processed documents will appear here
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => handleStartUpload()}
                      >
                        Upload a Document
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="pending" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Documents</CardTitle>
                  <CardDescription>
                    Documents being processed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDocuments ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : documents?.filter(doc => doc.status === 'processing').length > 0 ? (
                    <div className="space-y-4">
                      {documents.filter(doc => doc.status === 'processing').map((doc) => (
                        <DocumentCard 
                          key={doc.id} 
                          document={doc} 
                          onDelete={handleDeleteDocument}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Pending Documents</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Documents being processed will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DocumentsPage;