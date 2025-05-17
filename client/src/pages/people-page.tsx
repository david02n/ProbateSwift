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
  ArrowRight
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
  // Backward compatibility fields
  address: z.string().optional(),
  phone: z.string().optional(),
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
      
      // Make sure we got addresses back
      if (!data.addresses || data.addresses.length === 0) {
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
      
      // Check if we have addresses in the response
      if (data.addresses && Array.isArray(data.addresses)) {
        // The autocomplete endpoint returns an array of suggestion objects
        suggestions = data.addresses.map((suggestion: any, index: number) => {
          // Suggestion could be a string or an object with an 'address' property
          const addressText = typeof suggestion === 'string' 
            ? suggestion 
            : suggestion.address || suggestion.text || '';
          
          return {
            id: `${postcode}-${index}`,
            address: addressText.includes(postcode) ? addressText : `${addressText}, ${postcode}`,
            rawAddress: typeof suggestion === 'object' ? suggestion : null
          };
        });
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
  
  // Function to process the selected address and populate form fields
  const fetchAddressDetails = async (id: string) => {
    try {
      // Find the selected address from our suggestions
      const selectedAddress = addressSuggestions.find(suggestion => suggestion.id === id);
      
      if (!selectedAddress) {
        throw new Error('Address not found');
      }
      
      console.log("Selected address:", selectedAddress);
      
      // Format from GetAddress.io: "Building Name/Number, Street Name, Locality, Town/City, County, Postcode"
      // The selectedAddress.address will be in format "Full Address, Postcode"
      const fullAddress = selectedAddress.address;
      
      // Extract the postcode (last part)
      const addressParts = fullAddress.split(', ');
      const postcode = addressParts[addressParts.length - 1];
      
      // Now extract the address components
      // Remove the postcode from the address parts
      addressParts.pop();
      
      let addressLine1 = '';
      let addressLine2 = '';
      let city = '';
      let county = '';
      
      // GetAddress.io typically returns components in this order:
      // [0] = Building number/name
      // [1] = Street name
      // [Optional] = Locality
      // [n-2] = Town/City (where n is array length)
      // [n-1] = County (where n is array length)
      
      if (addressParts.length > 0) {
        // Building number/name + Street = Address Line 1
        if (addressParts.length >= 2) {
          addressLine1 = addressParts.slice(0, 2).join(', ');
          
          // If there are more than 3 parts, use the middle ones for address line 2
          if (addressParts.length >= 4) {
            addressLine2 = addressParts.slice(2, addressParts.length - 2).join(', ');
            city = addressParts[addressParts.length - 2];
            county = addressParts[addressParts.length - 1];
          } 
          // If there are exactly 3 parts, use the last one for city
          else if (addressParts.length === 3) {
            city = addressParts[2];
          }
        } else {
          // If there's only one part, use it as address line 1
          addressLine1 = addressParts[0];
        }
      }
      
      console.log("Parsed address components:", {
        addressLine1,
        addressLine2,
        city,
        county,
        postcode
      });
      
      // Fill the form with the address details
      form.setValue("addressLine1", addressLine1);
      form.setValue("addressLine2", addressLine2);
      form.setValue("city", city);
      form.setValue("county", county);
      form.setValue("postCode", postcode);
      
      // Close the suggestions dropdown
      setShowAddressSuggestions(false);
      setSelectedAddressId(id);
      
      toast({
        title: "Address selected",
        description: "The address has been filled in the form. You can now edit or complete any missing details if needed.",
      });
    } catch (error) {
      console.error("Error processing address details:", error);
      toast({
        title: "Failed to process address",
        description: "There was an error processing the address details. Please try again or enter your address manually.",
        variant: "destructive",
      });
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
    
    // Populate form with person data
    form.reset({
      firstName: executor.firstName,
      lastName: executor.lastName,
      email: executor.email || "",
      phone: executor.phone || "",
      address: executor.address || "",
      city: executor.city || "",
      postCode: executor.postCode || "",
      relationshipToDeceased: executor.relationshipToDeceased || "",
      isApplicant: executor.isApplicant || false,
      isNotifying: executor.isNotifying || false,
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
                            executor.isPrimary ? 'bg-primary text-white' : 'bg-gray-200'
                          }`}>
                            <User className="h-5 w-5" />
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
                              {executor.status === 'needs_more_info' && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Needs more information
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                              {executor.relationshipToDeceased || "Relationship not specified"} 
                              {executor.status === 'needs_more_info' && (
                                <span className="text-amber-600 ml-2 text-xs">
                                  Please complete all required fields
                                </span>
                              )}
                            </p>
                            {executor.status === 'needs_more_info' && (
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
            <DialogContent className="sm:max-w-md md:max-w-lg">
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
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select title (optional)" />
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
                  
                  {/* Name Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name(s) <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                  <div className="space-y-3 border-t pt-3">
                    <h3 className="text-sm font-medium">Address</h3>
                    
                    {/* Postcode Lookup */}
                    <div className="mb-4">
                      <div className="flex gap-2 items-end">
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
                        <Button
                          type="button"
                          onClick={handlePostcodeLookup}
                          disabled={isLoadingAddresses || manualAddressEntry}
                          className="mb-0.5"
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
                      
                      {/* Address suggestions dropdown */}
                      {showAddressSuggestions && addressSuggestions.length > 0 && (
                        <div className="relative mt-1">
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
                              {...field} 
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
                              {...field} 
                              disabled={!manualAddressEntry && selectedAddressId !== null}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Town or city <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Town or city" 
                                {...field} 
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
                          <FormItem>
                            <FormLabel>County</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="County (optional)" 
                                {...field} 
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
                          <FormItem className="hidden md:block">
                            <FormLabel>Postcode <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input disabled placeholder="Postcode" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="space-y-3 border-t pt-3">
                    <h3 className="text-sm font-medium">Contact Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormField
                        control={form.control}
                        name="phoneHome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Home telephone number</FormLabel>
                            <FormControl>
                              <Input placeholder="Home phone (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phoneMobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile or work telephone number</FormLabel>
                            <FormControl>
                              <Input placeholder="Mobile/work phone (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Email (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Role Information */}
                  <div className="space-y-3 border-t pt-3">
                    <h3 className="text-sm font-medium">Role & Relationship</h3>
                    
                    {!isLegalProfessional && (
                      <FormField
                        control={form.control}
                        name="relationshipToDeceased"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship to the deceased</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    
                    {/* Show executor checkbox only if there's an assessment with a will */}
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
                              <FormLabel>Serve as an executor</FormLabel>
                              <FormDescription>
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
                          <FormItem className="flex items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Primary Applicant</FormLabel>
                              <FormDescription>
                                This person will be the main applicant for the probate application
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="isNotifying"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Notifying Only</FormLabel>
                            <FormDescription>
                              This person will be notified but won't be actively involved in the probate process
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsPersonModalOpen(false)}
                    >
                      Cancel
                    </Button>
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
                        isEditing ? "Update Person" : "Save Person"
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
        </div>
      </main>
    </div>
  );
};

export default PeoplePage;