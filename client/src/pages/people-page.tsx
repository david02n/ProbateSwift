import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import NewHeader from "@/components/layout/NewHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus,
  Briefcase,
  Users,
  Loader2,
  Check,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Search,
  X,
  ArrowRight,
  FileText,
  Upload
} from "lucide-react";
import axios from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Executor, ProbateCase } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProcessedExecutor extends Executor {
  isPrimary?: boolean;
  isLegalProfessional?: boolean;
}

// Interface for postcode lookup response
interface PostcodeLookupSuggestion {
  id: string;
  address: string;
  rawAddress?: any; // To store the full address object when available
}

interface PostcodeLookupResult {
  postcode: string;
  line_1: string;
  line_2: string;
  town_or_city: string;
  county: string;
}

// Type for address fields that will be filled from postcode lookup
interface AddressFields {
  addressLine1: string;
  addressLine2: string;
  city: string;
  county: string;
  postCode: string;
}

// Create the form schema for adding a person
const executorFormSchema = z.object({
  title: z.string().optional(),
  firstName: z.string().min(1, { message: "First name is required" }),
  middleNames: z.string().optional(),
  lastName: z.string().min(1, { message: "Last name is required" }),
  isNameDifferentInWill: z.boolean().default(false),
  altNameInWill: z.string().optional(),
  addressLine1: z.string().min(1, { message: "Building and street is required" }),
  addressLine2: z.string().optional(),
  city: z.string().min(1, { message: "Town or city is required" }),
  county: z.string().optional(),
  postCode: z.string().min(1, { message: "Postcode is required" }),
  phoneHome: z.string().optional(),
  phoneMobile: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email" }).optional().or(z.literal("")),
  relationshipToDeceased: z.string().optional(),
  isExecutor: z.boolean().default(false),
  isApplicant: z.boolean().default(false),
  isNotifying: z.boolean().default(false),
  needsMoreInfo: z.boolean().default(false),
  // Backward compatibility fields
  address: z.string().optional(),
  phone: z.string().optional(),
});

// Create a more permissive schema for partial form submissions
const partialExecutorFormSchema = executorFormSchema.partial().extend({
  // Only require first name for partial submissions
  firstName: z.string().min(1, { message: "First name is required" }),
  // Mark as needing more info by default
  needsMoreInfo: z.boolean().default(true),
});

type ExecutorFormValues = z.infer<typeof executorFormSchema>;

const PeoplePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  // State to track modal open state
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  // State to track if we are adding a legal professional
  const [isLegalProfessional, setIsLegalProfessional] = useState(false);
  // State to track if we are editing a person
  const [isEditing, setIsEditing] = useState(false);
  // State to store the person being edited
  const [currentExecutor, setCurrentExecutor] = useState<Executor | null>(null);
  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // State to store the person ID to delete
  const [executorToDelete, setExecutorToDelete] = useState<number | null>(null);
  
  // Postcode lookup states
  const [postcodeQuery, setPostcodeQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<PostcodeLookupSuggestion[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [manualAddressEntry, setManualAddressEntry] = useState(false);
  
  // Self-suggestion state
  const [showSelfSuggestion, setShowSelfSuggestion] = useState(false);
  const [selfSuggestionDismissed, setSelfSuggestionDismissed] = useState(false);
  
  // Document-based person addition
  const [isPersonFromDocModalOpen, setIsPersonFromDocModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  
  // Initialize form with validation
  const form = useForm<ExecutorFormValues>({
    resolver: zodResolver(executorFormSchema),
    defaultValues: {
      title: "",
      firstName: "",
      middleNames: "",
      lastName: "",
      isNameDifferentInWill: false,
      altNameInWill: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      county: "",
      postCode: "",
      phoneHome: "",
      phoneMobile: "",
      email: "",
      relationshipToDeceased: "",
      isExecutor: false,
      isApplicant: false,
      isNotifying: false,
      // Legacy fields for compatibility
      address: "",
      phone: "",
    },
  });
  
  // Function to handle postcode lookup
  const handlePostcodeLookup = async () => {
    const postcode = form.getValues("postCode");
    if (!postcode || postcode.length < 3) {
      toast({
        title: "Invalid postcode",
        description: "Please enter a valid postcode to search for addresses",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingAddresses(true);
    setShowAddressSuggestions(true);
    
    try {
      console.log("Looking up addresses for postcode:", postcode);
      
      // Call our backend proxy endpoint that communicates with GetAddress.io
      const response = await fetch(`/api/address-lookup?postcode=${encodeURIComponent(postcode)}`);
      
      if (!response.ok) {
        // Check for specific errors
        if (response.status === 404) {
          toast({
            title: "Postcode not found",
            description: "Please check the postcode and try again, or enter your address manually.",
            variant: "destructive",
          });
          setIsLoadingAddresses(false);
          setShowAddressSuggestions(false);
          return;
        }
        
        if (response.status === 401) {
          toast({
            title: "Please log in",
            description: "You need to be logged in to use this feature.",
            variant: "destructive",
          });
          setIsLoadingAddresses(false);
          setShowAddressSuggestions(false);
          return;
        }
        
        throw new Error('Failed to fetch addresses');
      }
      
      const data = await response.json();
      console.log("Address lookup response:", data);
      
      // Make sure we got addresses back in either format
      if ((!data.suggestions || !Array.isArray(data.suggestions) || data.suggestions.length === 0) && 
          (!data.addresses || !Array.isArray(data.addresses) || data.addresses.length === 0)) {
        toast({
          title: "No addresses found",
          description: "No addresses were found for this postcode. Please check the postcode or enter your address manually.",
          variant: "destructive",
        });
        setIsLoadingAddresses(false);
        setShowAddressSuggestions(false);
        return;
      }
      
      // Process addresses from the GetAddress.io API response
      let suggestions: PostcodeLookupSuggestion[] = [];
      
      // Check if we have suggestions in the response (GetAddress.io autocomplete format)
      if (data.suggestions && Array.isArray(data.suggestions)) {
        // Map the suggestions directly from the API response
        suggestions = data.suggestions.map((suggestion: any) => ({
          id: suggestion.id || `${postcode}-${Math.random().toString(36).substring(2, 9)}`,
          address: suggestion.address || '',
          rawAddress: suggestion
        }));
      }
      
      console.log("Processed address suggestions:", suggestions);
      
      setAddressSuggestions(suggestions);
      toast({
        title: "Addresses found",
        description: `Found ${suggestions.length} addresses for this postcode.`,
      });
    } catch (error) {
      console.error("Error fetching addresses:", error);
      
      toast({
        title: "Address lookup failed",
        description: "There was a problem looking up addresses. Please try again or enter your address manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAddresses(false);
    }
  };
  
  // Function to handle the selected address - directly parse from the address string
  const fetchAddressDetails = async (id: string) => {
    try {
      // Find the selected address suggestion
      const selectedAddress = addressSuggestions.find(suggestion => suggestion.id === id);
      
      if (!selectedAddress) {
        throw new Error('Address not found in suggestions');
      }
      
      console.log("Selected address:", selectedAddress);
      
      setIsLoadingAddresses(true);
      
      // Extract address components from the full address string
      // Format from GetAddress.io is typically: "Building Number Street, City, County, Postcode"
      // Example: "73 St. Andrews Road, Southsea, Hampshire, PO5 1ES"
      const fullAddress = selectedAddress.address;
      const addressParts = fullAddress.split(', ');
      
      // Parse the address parts
      const extractedPostcode = addressParts[addressParts.length - 1].trim(); // Last part is postcode
      const extractedAddressLine1 = addressParts[0].trim(); // First part is building/street
      
      let extractedAddressLine2 = '';
      let extractedCity = '';
      let extractedCounty = '';
      
      // Handle different address formats based on number of parts
      if (addressParts.length === 4) {
        // Most common UK format: Building/Street, City, County, Postcode
        extractedCity = addressParts[1].trim();
        extractedCounty = addressParts[2].trim();
      } else if (addressParts.length === 3) {
        // Format without county: Building/Street, City, Postcode
        extractedCity = addressParts[1].trim();
      } else if (addressParts.length > 4) {
        // Format with multiple address lines or extra details
        extractedAddressLine2 = addressParts[1].trim();
        extractedCity = addressParts[addressParts.length - 3].trim();
        extractedCounty = addressParts[addressParts.length - 2].trim();
      }
      
      console.log("Parsed address components:", {
        addressLine1: extractedAddressLine1,
        addressLine2: extractedAddressLine2,
        city: extractedCity,
        county: extractedCounty,
        postcode: extractedPostcode
      });
      
      // Fill the form with the address details, ensuring we use empty string for null values
      form.setValue("addressLine1", extractedAddressLine1 || "");
      form.setValue("addressLine2", extractedAddressLine2 || "");
      form.setValue("city", extractedCity || "");
      form.setValue("county", extractedCounty || "");
      form.setValue("postCode", extractedPostcode || "");
      
      // Close the suggestions dropdown
      setShowAddressSuggestions(false);
      setSelectedAddressId(id);
      
      toast({
        title: "Address selected",
        description: "The address has been filled in the form. You can now edit or complete any missing details if needed.",
      });
    } catch (error) {
      console.error("Error processing address:", error);
      toast({
        title: "Failed to process address",
        description: "There was an error processing the address. Please try again or enter your address manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAddresses(false);
    }
  };
  
  // Function to fill form with current user's details (self-suggestion)
  const fillWithCurrentUserDetails = () => {
    if (user) {
      form.setValue("firstName", user.firstName || "");
      form.setValue("lastName", user.lastName || "");
      form.setValue("email", user.email || "");
      toast({
        title: "Added your details",
        description: "We've pre-filled the form with your details. Please review and add any missing information.",
      });
    }
  };
  
  // Toggle between manual address entry and postcode lookup
  const toggleManualAddressEntry = () => {
    setManualAddressEntry(!manualAddressEntry);
    if (!manualAddressEntry) {
      // Switching to manual entry - focus on first address field
      setTimeout(() => {
        const addressLine1Input = document.getElementById("addressLine1");
        if (addressLine1Input) addressLine1Input.focus();
      }, 100);
    }
  };
  
  // Get the user's probate cases
  const { 
    data: probateCases,
    isLoading: isLoadingCases 
  } = useQuery<ProbateCase[]>({
    queryKey: ["/api/probate-cases"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Get the active case ID (first case for now, could be selected by user later)
  const activeCaseId = probateCases && probateCases.length > 0 ? probateCases[0].id : undefined;
  
  // Get people for the active case
  const { 
    data: executors = [],
    isLoading: isLoadingExecutors 
  } = useQuery<Executor[]>({
    queryKey: ["/api/executors"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!activeCaseId,
  });
  
  // Create person mutation
  const createExecutorMutation = useMutation({
    mutationFn: async (executorData: Partial<Executor>) => {
      const res = await apiRequest("POST", "/api/executors", executorData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/executors"] });
      toast({
        title: "Person added",
        description: "The person has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding person",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update person mutation
  const updateExecutorMutation = useMutation({
    mutationFn: async ({ id, executorData }: { id: number, executorData: Partial<Executor> }) => {
      const res = await apiRequest("PUT", `/api/executors/${id}`, executorData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/executors"] });
      toast({
        title: "Person updated",
        description: "The person has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating person",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete person mutation
  const deleteExecutorMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/executors/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/executors"] });
      toast({
        title: "Person deleted",
        description: "The person has been removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting person",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Process people to identify primary applicants
  const processedExecutors: ProcessedExecutor[] = executors.map((executor, index) => {
    return {
      ...executor,
      isPrimary: executor.isApplicant || index === 0, // First person is primary if none marked as applicant
      isLegalProfessional: executor.relationshipToDeceased === "Legal Professional"
    };
  });
  
  // Filter out legal professionals
  const professionals = processedExecutors.filter(exec => exec.isLegalProfessional);
  const regularExecutors = processedExecutors.filter(exec => !exec.isLegalProfessional);
  
  // Handle opening person form
  const handleAddPerson = () => {
    if (!activeCaseId) {
      toast({
        title: "No probate case",
        description: "Please create a probate case first",
        variant: "destructive",
      });
      return;
    }
    
    // Reset form and set defaults
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postCode: "",
      relationshipToDeceased: "",
      isApplicant: regularExecutors.length === 0, // Make first person the applicant if none exist
      isNotifying: false,
    });
    
    // Open person modal for regular person
    setIsLegalProfessional(false);
    setIsPersonModalOpen(true);
  };
  
  // Handle opening professional form
  const handleAddProfessional = () => {
    if (!activeCaseId) {
      toast({
        title: "No probate case",
        description: "Please create a probate case first",
        variant: "destructive",
      });
      return;
    }
    
    // Reset form and set defaults for legal professional
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postCode: "",
      relationshipToDeceased: "Legal Professional",
      isApplicant: false,
      isNotifying: false,
    });
    
    // Open person modal for legal professional
    setIsLegalProfessional(true);
    setIsPersonModalOpen(true);
  };
  
  // Handler for editing a person
  const handleEditPerson = (executor: Executor) => {
    setCurrentExecutor(executor);
    setIsEditing(true);
    setIsLegalProfessional(executor.relationshipToDeceased === "Legal Professional");
    
    // Populate form with person data, ensuring all address fields are correctly populated
    form.reset({
      firstName: executor.firstName,
      lastName: executor.lastName,
      middleNames: executor.middleNames || "",
      title: executor.title || "",
      email: executor.email || "",
      phone: executor.phone || "",
      phoneHome: executor.phoneHome || "",
      phoneMobile: executor.phoneMobile || "",
      // Make sure all address fields are explicitly set
      addressLine1: executor.addressLine1 || executor.address || "",
      addressLine2: executor.addressLine2 || "",
      city: executor.city || "",
      county: executor.county || "",
      postCode: executor.postCode || "",
      relationshipToDeceased: executor.relationshipToDeceased || "",
      isExecutor: executor.isExecutor || false,
      isApplicant: executor.isApplicant || false,
      isNotifying: executor.isNotifying || false,
      isNameDifferentInWill: executor.isNameDifferentInWill || false,
      altNameInWill: executor.altNameInWill || ""
    });
    
    setIsPersonModalOpen(true);
  };
  
  // Handler for confirming person deletion
  const handleDeleteExecutor = (executorId: number) => {
    setExecutorToDelete(executorId);
    setIsDeleteDialogOpen(true);
  };
  
  // Handler for executing the deletion
  const confirmDeleteExecutor = () => {
    if (executorToDelete) {
      deleteExecutorMutation.mutate(executorToDelete, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setExecutorToDelete(null);
        }
      });
    }
  };
  
  // Handle form submission (for both create and update)
  const onSubmit = (data: ExecutorFormValues) => {
    if (!activeCaseId) return;
    
    // Check if all required fields are filled
    const requiredFieldsFilled = 
      !!data.firstName && 
      !!data.lastName && 
      !!data.addressLine1 && 
      !!data.city && 
      !!data.postCode;
      
    // Set status based on required fields
    const status = requiredFieldsFilled ? 'complete' : 'needs_more_info';
    
    // Prepare data with new fields
    const executorData = {
      caseId: activeCaseId,
      userId: user?.id || 0,
      title: data.title || null,
      firstName: data.firstName,
      middleNames: data.middleNames || null,
      lastName: data.lastName,
      isNameDifferentInWill: data.isNameDifferentInWill,
      altNameInWill: data.isNameDifferentInWill ? (data.altNameInWill || null) : null,
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      city: data.city || null,
      county: data.county || null,
      postCode: data.postCode || null,
      phoneHome: data.phoneHome || null,
      phoneMobile: data.phoneMobile || null,
      email: data.email || null,
      relationshipToDeceased: data.relationshipToDeceased || null,
      isExecutor: data.isExecutor,
      isApplicant: data.isApplicant,
      isNotifying: data.isNotifying,
      status: status,
      needsMoreInfo: !requiredFieldsFilled || data.needsMoreInfo || false,
      // Legacy fields for backward compatibility
      address: data.addressLine1 || null,
      phone: data.phoneMobile || data.phoneHome || null,
    };
    
    if (isEditing && currentExecutor) {
      // Update existing person
      updateExecutorMutation.mutate(
        { 
          id: currentExecutor.id, 
          executorData 
        },
        {
          onSuccess: () => {
            setIsPersonModalOpen(false);
            setIsEditing(false);
            setCurrentExecutor(null);
            form.reset();
          }
        }
      );
    } else {
      // Create new person
      createExecutorMutation.mutate(executorData, {
        onSuccess: () => {
          setIsPersonModalOpen(false);
          form.reset();
        }
      });
    }
  };
  
  const isLoading = isLoadingCases || isLoadingExecutors;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NewHeader />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-600">Loading people information...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!activeCaseId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NewHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">People</h1>
              <p className="text-gray-600">
                Manage people involved in the probate process
              </p>
            </div>
            
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-4">No probate case found. Please complete the assessment first to create a probate case.</p>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => window.location.href = "/"}>
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NewHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">People</h1>
            <p className="text-gray-600">
              Manage people involved in the probate process
            </p>
          </div>
          
          {/* People Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                People
              </CardTitle>
              <CardDescription>
                People involved in the probate process with different roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Quick Actions Row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button 
                  variant="outline" 
                  className="flex-1 flex items-center justify-center gap-2 border-dashed border-primary/50 hover:bg-primary/5"
                  onClick={() => {
                    if (!activeCaseId) {
                      toast({
                        title: "No probate case",
                        description: "Please create a probate case first",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Reset form and add current user details
                    form.reset({
                      firstName: user?.firstName || "",
                      lastName: user?.lastName || "",
                      email: user?.email || "",
                      isApplicant: regularExecutors.length === 0, // Make first executor the applicant if none exist
                      isNotifying: false,
                    });
                    
                    // Open person modal for user to confirm details
                    setIsLegalProfessional(false);
                    setIsPersonModalOpen(true);
                  }}
                >
                  <UserPlus className="h-5 w-5 text-primary" />
                  <span>Add Yourself</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1 flex items-center justify-center gap-2 border-dashed border-primary/50 hover:bg-primary/5"
                  onClick={() => {
                    // Will implement document-based person addition in next step
                    setIsPersonFromDocModalOpen(true);
                  }}
                >
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <span>Add from Document</span>
                </Button>
              </div>
              
              <div className="space-y-6">
                {regularExecutors.length > 0 ? (
                  regularExecutors.map((executor) => (
                    <div 
                      key={executor.id} 
                      className={`border rounded-lg p-5 ${
                        executor.isPrimary ? 'border-primary/20 bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex justify-between">
                        <div className="flex items-start">
                          <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-4 ${
                            executor.needsMoreInfo ? 'bg-amber-100 text-amber-600' :
                            executor.isPrimary ? 'bg-primary text-white' : 
                            'bg-gray-200'
                          }`}>
                            {executor.needsMoreInfo ? 
                              <AlertTriangle className="h-5 w-5" /> : 
                              <User className="h-5 w-5" />
                            }
                          </div>
                          <div>
                            <div className="flex items-center flex-wrap gap-2">
                              <h3 className="font-medium text-lg">
                                {executor.firstName} {executor.lastName}
                              </h3>
                              {executor.isPrimary && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  Primary Applicant
                                </span>
                              )}
                              {executor.isExecutor && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  Executor
                                </span>
                              )}
                              {executor.needsMoreInfo && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Needs more information
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                              {executor.relationshipToDeceased || "Relationship not specified"} 
                              {executor.needsMoreInfo && (
                                <span className="text-amber-600 ml-2 text-xs">
                                  Please complete all required fields
                                </span>
                              )}
                            </p>
                            {executor.needsMoreInfo && (
                              <div className="mt-2 text-xs">
                                <span className="font-medium text-amber-800">Missing: </span>
                                {!executor.firstName && <span className="text-amber-600 mr-1">First name</span>}
                                {!executor.lastName && <span className="text-amber-600 mr-1">Last name</span>}
                                {!executor.addressLine1 && <span className="text-amber-600 mr-1">Address</span>}
                                {!executor.city && <span className="text-amber-600 mr-1">Town/city</span>}
                                {!executor.postCode && <span className="text-amber-600 mr-1">Postcode</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditPerson(executor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => handleDeleteExecutor(executor.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Contact Information</p>
                          <div className="space-y-1 mt-1">
                            <p className="text-sm">{executor.email || "No email provided"}</p>
                            <p className="text-sm">{executor.phone || "No phone provided"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="text-sm mt-1">
                            {executor.address ? (
                              <>
                                {executor.address}
                                {executor.city && <>, {executor.city}</>}
                                {executor.postCode && <>, {executor.postCode}</>}
                              </>
                            ) : (
                              "No address provided"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>No people have been added yet.</p>
                  </div>
                )}
                
                {/* Add Person Button */}
                <div 
                  className="border rounded-lg border-dashed p-5 text-center hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => {
                    if (!activeCaseId) {
                      toast({
                        title: "No probate case",
                        description: "Please create a probate case first",
                        variant: "destructive",
                      });
                      return;
                    }
                    handleAddPerson();
                  }}
                >
                  <UserPlus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-3">Add another person</p>
                  <Button 
                    className="bg-primary hover:bg-primary/90" 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the parent div click
                      handleAddPerson();
                    }}
                    disabled={createExecutorMutation.isPending}
                  >
                    {createExecutorMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Person"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Legal Professionals Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-primary" />
                Legal Professionals
              </CardTitle>
              <CardDescription>
                Solicitors and professionals assisting with the probate process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {professionals.length > 0 ? (
                  professionals.map((professional) => (
                    <div key={professional.id} className="border rounded-lg p-5">
                      <div className="flex justify-between">
                        <div className="flex items-start">
                          <div className="rounded-full w-10 h-10 bg-blue-100 flex items-center justify-center mr-4">
                            <Briefcase className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">
                              {professional.firstName} {professional.lastName}
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">
                              {professional.relationshipToDeceased}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditPerson(professional)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => handleDeleteExecutor(professional.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Contact Information</p>
                          <div className="space-y-1 mt-1">
                            <p className="text-sm">{professional.email || "No email provided"}</p>
                            <p className="text-sm">{professional.phone || "No phone provided"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="text-sm mt-1">
                            {professional.address ? (
                              <>
                                {professional.address}
                                {professional.city && <>, {professional.city}</>}
                                {professional.postCode && <>, {professional.postCode}</>}
                              </>
                            ) : (
                              "No address provided"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>No legal professionals have been added yet.</p>
                  </div>
                )}
                
                {/* Add Legal Professional Button */}
                <div 
                  className="border rounded-lg border-dashed p-5 text-center hover:bg-gray-50 transition cursor-pointer"
                  onClick={handleAddProfessional}
                >
                  <Plus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-3">Add a legal professional</p>
                  <Button 
                    className="bg-primary hover:bg-primary/90" 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the parent div click
                      handleAddProfessional();
                    }}
                    disabled={createExecutorMutation.isPending}
                  >
                    {createExecutorMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Legal Professional"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Add Person Modal */}
          <Dialog open={isPersonModalOpen} onOpenChange={(open) => {
            setIsPersonModalOpen(open);
            if (!open) {
              // Reset editing state when dialog is closed
              setIsEditing(false);
              setCurrentExecutor(null);
            }
          }}>
            <DialogContent className="sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditing 
                    ? (isLegalProfessional ? "Edit Legal Professional" : "Edit Person") 
                    : (isLegalProfessional ? "Add Legal Professional" : "Add Person")
                  }
                </DialogTitle>
                <DialogDescription>
                  {isLegalProfessional 
                    ? `${isEditing ? "Edit" : "Add"} details of a solicitor or legal professional who is assisting with the probate process.` 
                    : `${isEditing ? "Edit" : "Add"} details of a person who is involved in the probate process or who will be handling the estate.`}
                </DialogDescription>
                
                {/* Self-suggestion banner */}
                {showSelfSuggestion && !isEditing && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="flex">
                        <User className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">It looks like you're involved in this case</h4>
                          <p className="text-xs text-blue-700 mt-1">Add yourself as a person in this case?</p>
                        </div>
                      </div>
                      <div>
                        <Button 
                          size="sm" 
                          className="h-7 bg-blue-600 hover:bg-blue-700 text-xs" 
                          onClick={fillWithCurrentUserDetails}
                        >
                          Add Yourself
                        </Button>
                      </div>
                    </div>
                    <button 
                      className="text-xs text-blue-700 mt-2 hover:underline flex items-center"
                      onClick={() => {
                        setSelfSuggestionDismissed(true);
                        setShowSelfSuggestion(false);
                      }}
                    >
                      <X className="h-3 w-3 mr-1" /> Do not show again
                    </button>
                  </div>
                )}
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Name Section - Better spacing and layout */}
                  <div className="grid grid-cols-4 gap-4">
                    {/* Title - Takes less space */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>Title</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Title" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mr">Mr</SelectItem>
                              <SelectItem value="Mrs">Mrs</SelectItem>
                              <SelectItem value="Miss">Miss</SelectItem>
                              <SelectItem value="Ms">Ms</SelectItem>
                              <SelectItem value="Dr">Dr</SelectItem>
                              <SelectItem value="Prof">Prof</SelectItem>
                              <SelectItem value="Rev">Rev</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* First Name */}
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>First name(s) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Last Name */}
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>Last name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Middle Names */}
                  <FormField
                    control={form.control}
                    name="middleNames"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle name(s)</FormLabel>
                        <FormControl>
                          <Input placeholder="Middle names (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Will has name override */}
                  {form.watch("isExecutor") && (
                    <>
                      <FormField
                        control={form.control}
                        name="isNameDifferentInWill"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-3 space-y-0 mt-2">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Is your name different in the will?</FormLabel>
                              <FormDescription>
                                Select this if the person's name appears differently in the will document
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {form.watch("isNameDifferentInWill") && (
                        <FormField
                          control={form.control}
                          name="altNameInWill"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alternative name in will</FormLabel>
                              <FormControl>
                                <Input placeholder="Name as it appears in the will" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}
                  
                  {/* Address Information */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-medium mt-2">Address</h3>
                    
                    {/* Postcode Lookup - Improved layout */}
                    <div className="mb-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name="postCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postcode <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter postcode" 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(e);
                                      // Reset address lookup states when postcode changes
                                      if (selectedAddressId) {
                                        setSelectedAddressId(null);
                                        setAddressSuggestions([]);
                                      }
                                    }}
                                    disabled={manualAddressEntry}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="self-end">
                          <Button
                            type="button"
                            onClick={handlePostcodeLookup}
                            disabled={isLoadingAddresses || manualAddressEntry}
                            className="w-full sm:w-auto mb-0.5"
                          >
                            {isLoadingAddresses ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Search className="h-4 w-4 mr-1" />
                                Find Address
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Address suggestions dropdown */}
                      {showAddressSuggestions && addressSuggestions.length > 0 && (
                        <div className="relative mt-2">
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            <div className="p-2 text-xs text-gray-500 border-b">
                              Select an address from the list:
                            </div>
                            <ul className="py-1">
                              {addressSuggestions.map((suggestion) => (
                                <li 
                                  key={suggestion.id}
                                  className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                                  onClick={() => fetchAddressDetails(suggestion.id)}
                                >
                                  {suggestion.address}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                          onClick={toggleManualAddressEntry}
                        >
                          {manualAddressEntry ? (
                            <>
                              <Search className="h-3 w-3 mr-1" />
                              Use postcode lookup
                            </>
                          ) : (
                            <>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit address manually
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Address lines - Improved layout */}
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Building and street <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              id="addressLine1"
                              placeholder="Address line 1" 
                              value={field.value || ""}
                              onChange={field.onChange}
                              disabled={!manualAddressEntry && selectedAddressId !== null}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Second line of address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Address line 2 (optional)" 
                              value={field.value || ""}
                              onChange={field.onChange}
                              disabled={!manualAddressEntry && selectedAddressId !== null}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Town, County and Postcode - Improved responsive grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>Town or city <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Town or city" 
                                value={field.value || ""}
                                onChange={field.onChange}
                                disabled={!manualAddressEntry && selectedAddressId !== null}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="county"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>County</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="County (optional)" 
                                value={field.value || ""}
                                onChange={field.onChange}
                                disabled={!manualAddressEntry && selectedAddressId !== null}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="postCode"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-1">
                            <FormLabel>Postcode <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Postcode"
                                value={field.value || ""}
                                onChange={field.onChange}
                                disabled={!manualAddressEntry && selectedAddressId !== null}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Contact Information - Improved layout */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-medium mt-2">Contact Information</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>Email address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Email address" 
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phoneMobile"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>Mobile telephone</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="Mobile phone" 
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phoneHome"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>Home telephone (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="Home phone" 
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Role Information - Improved layout */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-medium mt-2">Role & Relationship</h3>
                    
                    {!isLegalProfessional && (
                      <FormField
                        control={form.control}
                        name="relationshipToDeceased"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship to the deceased</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship to the deceased" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Spouse/Partner">Spouse/Partner</SelectItem>
                                <SelectItem value="Child">Child</SelectItem>
                                <SelectItem value="Parent">Parent</SelectItem>
                                <SelectItem value="Sibling">Sibling</SelectItem>
                                <SelectItem value="Other Family Member">Other Family Member</SelectItem>
                                <SelectItem value="Friend">Friend</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {/* Role checkboxes with improved styling */}
                    <div className="bg-gray-50 p-4 rounded-md mt-4 border border-gray-100">
                      <div className="space-y-4">
                        {!isLegalProfessional && activeCaseId && (
                          <FormField
                            control={form.control}
                            name="isExecutor"
                            render={({ field }) => (
                              <FormItem className="flex items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-medium">Serve as an executor</FormLabel>
                                  <FormDescription className="text-xs">
                                    This person is named as an executor in the will
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        )}
                        
                        {!isLegalProfessional && (
                          <FormField
                            control={form.control}
                            name="isApplicant"
                            render={({ field }) => (
                              <FormItem className="flex items-start space-x-3 space-y-0 border-t border-gray-200 pt-3">
                                <FormControl>
                                  <Checkbox 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-medium">Primary Applicant</FormLabel>
                                  <FormDescription className="text-xs">
                                    This person will be the main applicant for the probate application
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        )}
                        
                        {!isLegalProfessional && (
                          <FormField
                            control={form.control}
                            name="isNotifying"
                            render={({ field }) => (
                              <FormItem className="flex items-start space-x-3 space-y-0 border-t border-gray-200 pt-3">
                                <FormControl>
                                  <Checkbox 
                                    checked={field.value} 
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-medium">Notifying Only</FormLabel>
                                  <FormDescription className="text-xs">
                                    This person will be notified but won't be actively involved in the probate process
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2 w-full justify-start">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsPersonModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          // Use partial validation for saving incomplete information
                          const currentValues = form.getValues();
                          
                          // Validate using the partial schema (only requires firstName)
                          const result = partialExecutorFormSchema.safeParse({
                            ...currentValues,
                            needsMoreInfo: true
                          });
                          
                          if (result.success) {
                            // Form data is valid for partial save
                            const formData = {
                              ...currentValues,
                              needsMoreInfo: true,
                              caseId: activeCaseId!,
                              userId: user?.id
                            };
                            
                            if (isEditing && currentExecutor) {
                              // Update existing record
                              updateExecutorMutation.mutate({
                                id: currentExecutor.id,
                                executorData: formData
                              });
                            } else {
                              // Create new record
                              createExecutorMutation.mutate(formData);
                            }
                          } else {
                            // Show validation errors for the minimal required fields
                            toast({
                              title: "Missing information",
                              description: "Please at least provide a first name",
                              variant: "destructive"
                            });
                          }
                        }}
                        disabled={createExecutorMutation.isPending || updateExecutorMutation.isPending}
                      >
                        {createExecutorMutation.isPending || updateExecutorMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Save Incomplete
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <Button 
                      type="submit"
                      className="bg-primary hover:bg-primary/90"
                      disabled={createExecutorMutation.isPending || updateExecutorMutation.isPending}
                    >
                      {createExecutorMutation.isPending || updateExecutorMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          {isEditing ? "Update Person" : "Save Person"}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently remove the person from the estate.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteExecutor}
                  className="bg-red-600 text-white hover:bg-red-700"
                  disabled={deleteExecutorMutation.isPending}
                >
                  {deleteExecutorMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Person"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Add Person from Document Dialog */}
          <Dialog open={isPersonFromDocModalOpen} onOpenChange={setIsPersonFromDocModalOpen}>
            <DialogContent className="sm:max-w-md md:max-w-xl">
              <DialogHeader>
                <DialogTitle>Add Person from Document</DialogTitle>
                <DialogDescription>
                  Add person details from an existing document or upload a new document to extract information.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Select Document Type</h3>
                  
                  {/* Desktop Document Selection - Button Grid */}
                  <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant={selectedDocumentType === 'will' ? 'default' : 'outline'}
                      className={`flex justify-start items-start h-auto py-3 px-4 ${
                        selectedDocumentType === 'will' ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedDocumentType('will')}
                    >
                      <div className="flex-1 text-left">
                        <div className="font-medium">Will</div>
                        <div className="text-xs text-gray-500 mt-1 whitespace-normal">
                          Extract executors and beneficiaries from Will
                        </div>
                      </div>
                    </Button>
                    
                    <Button
                      type="button"
                      variant={selectedDocumentType === 'death_certificate' ? 'default' : 'outline'}
                      className={`flex justify-start items-start h-auto py-3 px-4 ${
                        selectedDocumentType === 'death_certificate' ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedDocumentType('death_certificate')}
                    >
                      <div className="flex-1 text-left">
                        <div className="font-medium">Death Certificate</div>
                        <div className="text-xs text-gray-500 mt-1 whitespace-normal">
                          Add deceased person to this case
                        </div>
                      </div>
                    </Button>
                    
                    <Button
                      type="button"
                      variant={selectedDocumentType === 'id_document' ? 'default' : 'outline'}
                      className={`flex justify-start items-start h-auto py-3 px-4 ${
                        selectedDocumentType === 'id_document' ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedDocumentType('id_document')}
                    >
                      <div className="flex-1 text-left">
                        <div className="font-medium">ID Document</div>
                        <div className="text-xs text-gray-500 mt-1 whitespace-normal">
                          Extract details from passport or driving license
                        </div>
                      </div>
                    </Button>
                    
                    <Button
                      type="button"
                      variant={selectedDocumentType === 'bill' ? 'default' : 'outline'}
                      className={`flex justify-start items-start h-auto py-3 px-4 ${
                        selectedDocumentType === 'bill' ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedDocumentType('bill')}
                    >
                      <div className="flex-1 text-left">
                        <div className="font-medium">Bill or Statement</div>
                        <div className="text-xs text-gray-500 mt-1 whitespace-normal">
                          Extract name and address details
                        </div>
                      </div>
                    </Button>
                    
                    <Button
                      type="button"
                      variant={selectedDocumentType === 'other' ? 'default' : 'outline'}
                      className={`flex justify-start items-start h-auto py-3 px-4 ${
                        selectedDocumentType === 'other' ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedDocumentType('other')}
                    >
                      <div className="flex-1 text-left">
                        <div className="font-medium">Other Document</div>
                        <div className="text-xs text-gray-500 mt-1 whitespace-normal">
                          Upload any other document with person details
                        </div>
                      </div>
                    </Button>
                  </div>
                  
                  {/* Mobile Document Selection - Dropdown */}
                  <div className="sm:hidden">
                    <Select value={selectedDocumentType || ""} onValueChange={(value) => setSelectedDocumentType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="will">Will</SelectItem>
                        <SelectItem value="death_certificate">Death Certificate</SelectItem>
                        <SelectItem value="id_document">ID Document</SelectItem>
                        <SelectItem value="bill">Bill or Statement</SelectItem>
                        <SelectItem value="other">Other Document</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Description for selected doc type on mobile */}
                    {selectedDocumentType && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                        {selectedDocumentType === 'will' && (
                          <p>Extract executors and beneficiaries from the Will document</p>
                        )}
                        {selectedDocumentType === 'death_certificate' && (
                          <p>Extract deceased person's details automatically for this probate case</p>
                        )}
                        {selectedDocumentType === 'id_document' && (
                          <p>Extract details from passport, driving license or other ID</p>
                        )}
                        {selectedDocumentType === 'bill' && (
                          <p>Extract name and address details from bills or statements</p>
                        )}
                        {selectedDocumentType === 'other' && (
                          <p>Upload any other document containing person details</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50 relative">
                  {/* Coming Soon Overlay - Only for "Other Document" type */}
                  {selectedDocumentType === 'other' && (
                    <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
                      <div className="bg-primary text-white font-semibold px-4 py-2 rounded-full mb-2">
                        Coming Soon
                      </div>
                      <p className="text-center text-gray-600 max-w-md px-4">
                        Document processing for this document type is currently in development.
                      </p>
                    </div>
                  )}
                  
                  <h3 className="text-sm font-medium mb-3">Choose Document Source</h3>
                  
                  <div className="space-y-3">
                    {/* Select from previously uploaded documents */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium">Select from uploaded documents</label>
                      {selectedDocumentType && selectedDocumentType !== 'other' ? (
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an uploaded document" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* This will be populated with actual documents from your documents tab */}
                            <SelectItem value="example1">Will_Draft_Final.pdf</SelectItem>
                            <SelectItem value="example2">Death_Certificate.pdf</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select disabled={true}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an uploaded document" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="example1">Will_Draft_Final.pdf</SelectItem>
                            <SelectItem value="example2">Death_Certificate.pdf</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-50 px-2 text-gray-500">Or</span>
                      </div>
                    </div>
                    
                    {/* Upload a new document */}
                    <div>
                      <label className="text-sm font-medium">Upload a new document</label>
                      
                      {selectedDocumentType && selectedDocumentType !== 'other' ? (
                        <>
                          {/* Desktop File Upload */}
                          <div className="hidden sm:flex mt-2 justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
                            <div className="text-center">
                              <label htmlFor="file-upload" className="cursor-pointer">
                                <Upload className="mx-auto h-12 w-12 text-gray-300" />
                                <div className="mt-4 text-sm leading-6 text-gray-600">
                                  <span className="font-semibold text-primary">Upload a file</span>
                                  <span className="pl-1">or drag and drop</span>
                                </div>
                                <p className="text-xs leading-5 text-gray-600">PDF, PNG, JPG up to 10MB</p>
                                <input 
                                  id="file-upload" 
                                  name="file-upload" 
                                  type="file" 
                                  className="sr-only" 
                                  accept=".pdf,.png,.jpg,.jpeg" 
                                />
                              </label>
                            </div>
                          </div>
                          
                          {/* Mobile Upload Options */}
                          <div className="sm:hidden mt-4">
                            <div className="grid grid-cols-2 gap-3">
                              {/* Take Photo */}
                              <label className="cursor-pointer">
                                <div className="flex flex-col items-center justify-center h-24 p-2 border rounded-md border-input">
                                  <Upload className="h-8 w-8 mb-2 text-gray-400" />
                                  <span className="text-sm text-center text-gray-400">Take Photo</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment" 
                                    className="sr-only" 
                                  />
                                </div>
                              </label>
                              
                              {/* Choose from Camera Roll */}
                              <label className="cursor-pointer">
                                <div className="flex flex-col items-center justify-center h-24 p-2 border rounded-md border-input">
                                  <FileText className="h-8 w-8 mb-2 text-gray-400" />
                                  <span className="text-sm text-center text-gray-400">Camera Roll</span>
                                  <input 
                                    type="file" 
                                    accept="image/*,.pdf" 
                                    className="sr-only" 
                                  />
                                </div>
                              </label>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Desktop File Upload - Disabled version */}
                          <div className="hidden sm:flex mt-2 justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10 opacity-60">
                            <div className="text-center">
                              <Upload className="mx-auto h-12 w-12 text-gray-300" />
                              <div className="mt-4 text-sm leading-6 text-gray-600">
                                <span className="font-semibold text-primary">Upload a file</span>
                                <span className="pl-1">or drag and drop</span>
                              </div>
                              <p className="text-xs leading-5 text-gray-600">PDF, PNG, JPG up to 10MB</p>
                            </div>
                          </div>
                          
                          {/* Mobile Upload Options - Disabled version */}
                          <div className="sm:hidden mt-4">
                            <div className="grid grid-cols-2 gap-3 opacity-60">
                              {/* Take Photo */}
                              <div className="flex flex-col items-center justify-center h-24 p-2 border rounded-md border-input">
                                <Upload className="h-8 w-8 mb-2 text-gray-400" />
                                <span className="text-sm text-center text-gray-400">Take Photo</span>
                              </div>
                              
                              {/* Choose from Camera Roll */}
                              <div className="flex flex-col items-center justify-center h-24 p-2 border rounded-md border-input">
                                <FileText className="h-8 w-8 mb-2 text-gray-400" />
                                <span className="text-sm text-center text-gray-400">Camera Roll</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPersonFromDocModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!selectedDocumentType || selectedDocumentType === 'other'}
                  onClick={() => {
                    if (selectedDocumentType === 'other') {
                      toast({
                        title: "Coming Soon",
                        description: "This document type processing is still in development.",
                      });
                      return;
                    }
                    
                    // Extract data from the document and pre-fill the person form
                    // For now, we'll show a successful toast and close the modal
                    toast({
                      title: "Document Processed",
                      description: `Person details extracted from ${selectedDocumentType.replace('_', ' ')}`,
                    });
                    
                    // Pre-fill a new person form with some default values based on document type
                    const newPerson = {
                      firstName: selectedDocumentType === 'will' ? 'Executor' : 'Person',
                      lastName: 'From Document',
                      status: 'needs_more_info'
                    };
                    
                    // Instead of opening the form, directly create a new person from the document
                    if (activeCaseId && selectedDocumentType) {
                      // Create a new person with the document details
                      createExecutorMutation.mutate({
                        firstName: newPerson.firstName,
                        lastName: newPerson.lastName,
                        caseId: activeCaseId,
                        userId: user?.id,
                        isExecutor: selectedDocumentType === 'will',
                        isApplicant: selectedDocumentType === 'id_document',
                        needsMoreInfo: true,
                        relationshipToDeceased: selectedDocumentType === 'death_certificate' ? 'Deceased' : ''
                      });
                    }
                    
                    // Close the modal
                    setIsPersonFromDocModalOpen(false);
                  }}
                >
                  Extract Person Details
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default PeoplePage;