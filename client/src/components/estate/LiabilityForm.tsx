import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { EstateLiability } from '@shared/schema';

// Liability form schema matching database schema
const liabilityFormSchema = z.object({
  type: z.enum(['mortgage', 'loan', 'credit_card', 'utility', 'tax', 'other']),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  creditor: z.string().optional(),
  accountNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type LiabilityFormValues = z.infer<typeof liabilityFormSchema>;

interface LiabilityFormProps {
  onSubmit: (data: LiabilityFormValues) => void;
  initialData?: Partial<EstateLiability>;
  isSubmitting?: boolean;
  onCancel: () => void;
}

const LiabilityForm: React.FC<LiabilityFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false,
  onCancel,
}) => {
  // Default form values with explicit type casting for safety
  const defaultValues: Partial<LiabilityFormValues> = {
    type: (initialData?.type as 'mortgage' | 'loan' | 'credit_card' | 'utility' | 'tax' | 'other') || 'loan',
    description: initialData?.description || '',
    amount: initialData?.amount?.toString() || '',
    creditor: initialData?.creditor || '',
    accountNumber: initialData?.accountNumber || '',
    notes: initialData?.notes || '',
  };

  // Initialize form
  const form = useForm<LiabilityFormValues>({
    resolver: zodResolver(liabilityFormSchema),
    defaultValues,
  });

  // Form submission handler
  const handleSubmit = (values: LiabilityFormValues) => {
    onSubmit(values);
  };

  // Get the current liability type
  const liabilityType = form.watch('type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Liability Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Liability Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select liability type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="utility">Utility Bill</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
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
                <Input placeholder={`Enter a description for this ${liabilityType.replace('_', ' ')}`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount Owed (£)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter the amount owed" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Enter the amount owed at date of death
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional fields based on liability type */}
        {(['mortgage', 'loan', 'credit_card'].includes(liabilityType)) && (
          <>
            <FormField
              control={form.control}
              name="creditor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creditor/Institution</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the creditor or financial institution" {...field} />
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
            ) : 'Save Liability'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LiabilityForm;