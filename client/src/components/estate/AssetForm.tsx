import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { EstateAsset } from '@shared/schema';

// Asset form schema with strict types matching the database schema
const assetFormSchema = z.object({
  type: z.enum(['property', 'bank_account', 'investment', 'vehicle', 'cash', 'other']),
  description: z.string().min(1, 'Description is required'),
  value: z.string().min(1, 'Value is required'),
  address: z.string().optional(),
  institution: z.string().optional(),
  accountNumber: z.string().optional(),
  ownership: z.enum(['sole', 'joint']).optional(),
  notes: z.string().optional(),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  onSubmit: (data: AssetFormValues) => void;
  initialData?: Partial<EstateAsset>;
  isSubmitting?: boolean;
  onCancel: () => void;
}

const AssetForm: React.FC<AssetFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false,
  onCancel,
}) => {
  // Default form values with explicit type casting for safety
  const defaultValues: Partial<AssetFormValues> = {
    type: (initialData?.type as 'property' | 'bank_account' | 'investment' | 'vehicle' | 'cash' | 'other') || 'property',
    description: initialData?.description || '',
    value: initialData?.value?.toString() || '',
    address: initialData?.address || '',
    institution: initialData?.institution || '',
    accountNumber: initialData?.accountNumber || '',
    ownership: (initialData?.ownership as 'sole' | 'joint') || 'sole',
    notes: initialData?.notes || '',
  };

  // Initialize form
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues,
  });

  // Form submission handler
  const handleSubmit = (values: AssetFormValues) => {
    onSubmit(values);
  };

  // Get the current asset type
  const assetType = form.watch('type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Asset Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="bank_account">Bank Account</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder={`Enter a description for this ${assetType.replace('_', ' ')}`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Value */}
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value (£)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter the estimated value" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Enter the estimated value at date of death
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional fields based on asset type */}
        {assetType === 'property' && (
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter the property address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(assetType === 'bank_account' || assetType === 'investment') && (
          <>
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the financial institution" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the account number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input placeholder="Enter any additional notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form buttons */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Asset'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AssetForm;