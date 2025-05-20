import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Calendar as CalendarIcon, Check, X, Save, ChevronLeft, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Define schema for the form
const deceasedFormSchema = z.object({
  // Basic Information
  dateOfBirth: z.date().optional(),
  dateOfDeath: z.date().optional(),
  birthPlace: z.string().optional(),
  deathPlace: z.string().optional(),
  
  // Other Names
  wasKnownByOtherNames: z.boolean().default(false),
  otherNamesHeldAssets: z.array(z.object({
    fullName: z.string().optional(),
    description: z.string().optional()
  })).optional(),
  
  // Domicile
  domicileInEnglandOrWales: z.boolean().optional(),
  
  // Marital Status
  maritalStatus: z.enum(['never_married', 'married', 'widowed', 'divorced', 'separated']).optional(),
  marriedDate: z.date().optional().nullable(),
  divorcedDate: z.date().optional().nullable(),
  divorceCourt: z.string().optional().nullable(),
  separatedDate: z.date().optional().nullable(),
  separationCourt: z.string().optional().nullable(),
  
  // Foreign Assets
  hadForeignAssets: z.boolean().default(false),
  foreignAssetValueGbp: z.string().optional().nullable(),
  
  // Land Settled
  landWasSettled: z.boolean().optional(),
  
  // Executors Applying
  executorsApplying: z.boolean().optional(),
  
  // Adoption History
  hasAdoptionHistory: z.boolean().default(false),
  adoptedRelatives: z.array(z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    direction: z.enum(['in', 'out']).optional()
  })).optional(),
});

type DeceasedFormValues = z.infer<typeof deceasedFormSchema>;

// Create a type for the other names array items
type OtherName = {
  fullName: string;
  description: string;
};

// Create a type for the adopted relatives array items
type AdoptedRelative = {
  name: string;
  relationship: string;
  direction: 'in' | 'out';
};

const DeceasedDetailsForm: React.FC = () => {
  const { personId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSaved, setFormSaved] = useState(false);
  const [otherNames, setOtherNames] = useState<OtherName[]>([]);
  const [adoptedRelatives, setAdoptedRelatives] = useState<AdoptedRelative[]>([]);
  const [isComplete, setIsComplete] = useState<boolean | null>(null);

  // Fetch deceased form fields data
  const { data: deceasedData, isLoading, isError, error } = useQuery({
    queryKey: [`/api/deceased-form-fields/${personId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/deceased-form-fields/${personId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch deceased details');
      }
      return await response.json();
    },
    enabled: !!personId,
  });

  // Check completion status
  const { data: completionData } = useQuery({
    queryKey: [`/api/deceased-form-fields/${personId}/complete`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/deceased-form-fields/${personId}/complete`);
      if (!response.ok) {
        return { complete: false };
      }
      return await response.json();
    },
    enabled: !!personId,
  });

  // Initialize form with validation
  const form = useForm<DeceasedFormValues>({
    resolver: zodResolver(deceasedFormSchema),
    defaultValues: {
      dateOfBirth: undefined,
      dateOfDeath: undefined,
      birthPlace: '',
      deathPlace: '',
      wasKnownByOtherNames: false,
      otherNamesHeldAssets: [],
      domicileInEnglandOrWales: undefined,
      maritalStatus: undefined,
      marriedDate: null,
      divorcedDate: null,
      divorceCourt: null,
      separatedDate: null,
      separationCourt: null,
      hadForeignAssets: false,
      foreignAssetValueGbp: null,
      landWasSettled: undefined,
      executorsApplying: undefined,
      hasAdoptionHistory: false,
      adoptedRelatives: [],
    },
    mode: 'onBlur',
  });

  // Mutation for updating deceased form fields
  const updateDeceasedFormFieldsMutation = useMutation({
    mutationFn: async (data: Partial<DeceasedFormValues>) => {
      const response = await apiRequest('PATCH', `/api/deceased-form-fields/${personId}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update deceased details');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/deceased-form-fields/${personId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deceased-form-fields/${personId}/complete`] });
      setFormSaved(true);
      setTimeout(() => setFormSaved(false), 3000);
      toast({
        title: 'Deceased details saved',
        description: 'The information has been successfully saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving deceased details',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update form values when data is loaded
  useEffect(() => {
    if (deceasedData) {
      // Convert date strings to Date objects
      const formattedData = {
        ...deceasedData,
        dateOfBirth: deceasedData.dateOfBirth ? new Date(deceasedData.dateOfBirth) : undefined,
        dateOfDeath: deceasedData.dateOfDeath ? new Date(deceasedData.dateOfDeath) : undefined,
        marriedDate: deceasedData.marriedDate ? new Date(deceasedData.marriedDate) : null,
        divorcedDate: deceasedData.divorcedDate ? new Date(deceasedData.divorcedDate) : null,
        separatedDate: deceasedData.separatedDate ? new Date(deceasedData.separatedDate) : null,
      };
      
      // Reset form with the formatted data
      form.reset(formattedData);
      
      // Update other names state
      if (formattedData.otherNamesHeldAssets && formattedData.otherNamesHeldAssets.length > 0) {
        setOtherNames(formattedData.otherNamesHeldAssets);
      }
      
      // Update adopted relatives state
      if (formattedData.adoptedRelatives && formattedData.adoptedRelatives.length > 0) {
        setAdoptedRelatives(formattedData.adoptedRelatives);
      }
    }
  }, [deceasedData, form]);

  // Update completion status when completionData changes
  useEffect(() => {
    if (completionData) {
      setIsComplete(completionData.complete);
    }
  }, [completionData]);

  // Function to handle form submission
  const onSubmit = async (data: DeceasedFormValues) => {
    setIsSubmitting(true);
    
    // Format data for API submission
    const formattedData = {
      ...data,
      otherNamesHeldAssets: data.wasKnownByOtherNames ? otherNames : [],
      adoptedRelatives: data.hasAdoptionHistory ? adoptedRelatives : [],
    };
    
    try {
      await updateDeceasedFormFieldsMutation.mutateAsync(formattedData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to add a new other name
  const addOtherName = () => {
    setOtherNames([...otherNames, { fullName: '', description: '' }]);
  };

  // Function to update an other name
  const updateOtherName = (index: number, field: keyof OtherName, value: string) => {
    const updatedNames = [...otherNames];
    updatedNames[index] = { ...updatedNames[index], [field]: value };
    setOtherNames(updatedNames);
  };

  // Function to remove an other name
  const removeOtherName = (index: number) => {
    setOtherNames(otherNames.filter((_, i) => i !== index));
  };

  // Function to add a new adopted relative
  const addAdoptedRelative = () => {
    setAdoptedRelatives([...adoptedRelatives, { name: '', relationship: '', direction: 'in' }]);
  };

  // Function to update an adopted relative
  const updateAdoptedRelative = (index: number, field: keyof AdoptedRelative, value: any) => {
    const updatedRelatives = [...adoptedRelatives];
    updatedRelatives[index] = { ...updatedRelatives[index], [field]: value };
    setAdoptedRelatives(updatedRelatives);
  };

  // Function to remove an adopted relative
  const removeAdoptedRelative = (index: number) => {
    setAdoptedRelatives(adoptedRelatives.filter((_, i) => i !== index));
  };

  // Function to handle navigating back to the people page
  const handleBackToPeople = () => {
    navigate('/people');
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading deceased details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="mt-4 text-lg">Error: {(error as Error).message}</p>
          <Button className="mt-4" onClick={() => navigate('/people')}>
            Back to People
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-4 flex items-center text-muted-foreground hover:text-primary"
        onClick={handleBackToPeople}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to People
      </Button>
      
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Deceased Person Details</CardTitle>
            <CardDescription>
              Please complete all required information about the deceased person for probate purposes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isComplete === false && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800">Incomplete Information</h3>
                  <p className="text-amber-700 text-sm">Some required information is missing. Please complete all sections marked with an asterisk (*).</p>
                </div>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information Section */}
                <Accordion type="single" collapsible defaultValue="basic-info">
                  <AccordionItem value="basic-info">
                    <AccordionTrigger className="text-lg font-medium">
                      Basic Information
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Date of Birth */}
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date of Birth *</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Select date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Date of Death */}
                        <FormField
                          control={form.control}
                          name="dateOfDeath"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date of Death *</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Select date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Birth Place */}
                        <FormField
                          control={form.control}
                          name="birthPlace"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Place of Birth</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter birth place" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Death Place */}
                        <FormField
                          control={form.control}
                          name="deathPlace"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Place of Death</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter death place" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Other Names Section */}
                  <AccordionItem value="other-names">
                    <AccordionTrigger className="text-lg font-medium">
                      Other Names
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="wasKnownByOtherNames"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Was the deceased known by any other names?
                              </FormLabel>
                              <FormDescription>
                                Check this if the deceased used other names for financial assets or legal purposes.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {form.watch("wasKnownByOtherNames") && (
                        <div className="space-y-4 mt-6">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium">Other Names</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addOtherName}
                            >
                              Add Another Name
                            </Button>
                          </div>

                          {otherNames.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">
                              No other names added yet. Click "Add Another Name" to begin.
                            </div>
                          )}

                          {otherNames.map((name, index) => (
                            <div key={index} className="border rounded-md p-4 space-y-4">
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium">Other Name {index + 1}</h5>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOtherName(index)}
                                  className="text-destructive hover:text-destructive/90"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Full Name</label>
                                  <Input
                                    value={name.fullName}
                                    onChange={(e) => updateOtherName(index, 'fullName', e.target.value)}
                                    placeholder="Enter full name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Description/Usage</label>
                                  <Input
                                    value={name.description}
                                    onChange={(e) => updateOtherName(index, 'description', e.target.value)}
                                    placeholder="e.g., Used for bank accounts"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Domicile Section */}
                  <AccordionItem value="domicile">
                    <AccordionTrigger className="text-lg font-medium">
                      Domicile
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="domicileInEnglandOrWales"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Domicile Status *</FormLabel>
                            <FormDescription>
                              Did the deceased live in, or intend to return to, England or Wales?
                            </FormDescription>
                            <FormControl>
                              <div className="flex space-x-4">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="domicile-yes"
                                    checked={field.value === true}
                                    onChange={() => field.onChange(true)}
                                    className="h-4 w-4"
                                  />
                                  <label htmlFor="domicile-yes" className="text-sm">Yes</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="domicile-no"
                                    checked={field.value === false}
                                    onChange={() => field.onChange(false)}
                                    className="h-4 w-4"
                                  />
                                  <label htmlFor="domicile-no" className="text-sm">No</label>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Marital Status Section */}
                  <AccordionItem value="marital-status">
                    <AccordionTrigger className="text-lg font-medium">
                      Marital Status
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="maritalStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marital Status at Time of Death *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select marital status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="never_married">Never Married</SelectItem>
                                <SelectItem value="married">Married</SelectItem>
                                <SelectItem value="widowed">Widowed</SelectItem>
                                <SelectItem value="divorced">Divorced</SelectItem>
                                <SelectItem value="separated">Separated</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Conditional fields based on marital status */}
                      {form.watch("maritalStatus") === "married" && (
                        <FormField
                          control={form.control}
                          name="marriedDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date of Marriage *</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Select date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ?? undefined}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {form.watch("maritalStatus") === "divorced" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="divorcedDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Date of Divorce *</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Select date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value ?? undefined}
                                      onSelect={field.onChange}
                                      disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                      }
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="divorceCourt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Divorce Court *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter divorce court name" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {form.watch("maritalStatus") === "separated" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="separatedDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Date of Separation *</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Select date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value ?? undefined}
                                      onSelect={field.onChange}
                                      disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                      }
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="separationCourt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Separation Court *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter separation court name" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Foreign Assets Section */}
                  <AccordionItem value="foreign-assets">
                    <AccordionTrigger className="text-lg font-medium">
                      Foreign Assets
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="hadForeignAssets"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Did the deceased own assets outside England and Wales?
                              </FormLabel>
                              <FormDescription>
                                Check this if the deceased owned property, investments, bank accounts, or other assets abroad.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {form.watch("hadForeignAssets") && (
                        <FormField
                          control={form.control}
                          name="foreignAssetValueGbp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Value of Foreign Assets (GBP) *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter value in £" 
                                  {...field} 
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    // Allow only numeric values with optional decimal point
                                    const value = e.target.value.replace(/[^\d.]/g, '');
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide the estimated value in British Pounds (£)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Land Settled Section */}
                  <AccordionItem value="land-settled">
                    <AccordionTrigger className="text-lg font-medium">
                      Settled Land
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="landWasSettled"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Settled Land *</FormLabel>
                            <FormDescription>
                              Was any land settled under the Settled Land Act?
                            </FormDescription>
                            <FormControl>
                              <div className="flex space-x-4">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="settled-yes"
                                    checked={field.value === true}
                                    onChange={() => field.onChange(true)}
                                    className="h-4 w-4"
                                  />
                                  <label htmlFor="settled-yes" className="text-sm">Yes</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="settled-no"
                                    checked={field.value === false}
                                    onChange={() => field.onChange(false)}
                                    className="h-4 w-4"
                                  />
                                  <label htmlFor="settled-no" className="text-sm">No</label>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Executors Applying Section */}
                  <AccordionItem value="executors-applying">
                    <AccordionTrigger className="text-lg font-medium">
                      Executors Applying
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="executorsApplying"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Executors Named in Will *</FormLabel>
                            <FormDescription>
                              Are all executors named in the will applying for probate?
                            </FormDescription>
                            <FormControl>
                              <div className="flex space-x-4">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="executors-yes"
                                    checked={field.value === true}
                                    onChange={() => field.onChange(true)}
                                    className="h-4 w-4"
                                  />
                                  <label htmlFor="executors-yes" className="text-sm">Yes</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="executors-no"
                                    checked={field.value === false}
                                    onChange={() => field.onChange(false)}
                                    className="h-4 w-4"
                                  />
                                  <label htmlFor="executors-no" className="text-sm">No</label>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Adoption History Section */}
                  <AccordionItem value="adoption-history">
                    <AccordionTrigger className="text-lg font-medium">
                      Adoption History
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="hasAdoptionHistory"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Is there any adoption history in the deceased's family?
                              </FormLabel>
                              <FormDescription>
                                Check this if anyone was legally adopted into or out of the deceased's family.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {form.watch("hasAdoptionHistory") && (
                        <div className="space-y-4 mt-6">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium">Adopted Relatives</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addAdoptedRelative}
                            >
                              Add Adopted Relative
                            </Button>
                          </div>

                          {adoptedRelatives.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">
                              No adopted relatives added yet. Click "Add Adopted Relative" to begin.
                            </div>
                          )}

                          {adoptedRelatives.map((relative, index) => (
                            <div key={index} className="border rounded-md p-4 space-y-4">
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium">Adopted Relative {index + 1}</h5>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAdoptedRelative(index)}
                                  className="text-destructive hover:text-destructive/90"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Name</label>
                                  <Input
                                    value={relative.name}
                                    onChange={(e) => updateAdoptedRelative(index, 'name', e.target.value)}
                                    placeholder="Enter name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Relationship</label>
                                  <Input
                                    value={relative.relationship}
                                    onChange={(e) => updateAdoptedRelative(index, 'relationship', e.target.value)}
                                    placeholder="e.g., Child, Sibling"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Direction</label>
                                  <Select
                                    value={relative.direction}
                                    onValueChange={(value) => updateAdoptedRelative(index, 'direction', value as 'in' | 'out')}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select direction" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="in">Adopted Into Family</SelectItem>
                                      <SelectItem value="out">Adopted Out of Family</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex justify-between pt-6 border-t items-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBackToPeople}
                  >
                    Cancel
                  </Button>
                  <div className="flex items-center gap-4">
                    {formSaved && (
                      <span className="text-green-600 flex items-center">
                        <Check className="w-4 h-4 mr-1" /> Saved
                      </span>
                    )}
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Details
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeceasedDetailsForm;