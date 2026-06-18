import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

const listingSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  discountRate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, "Discount rate must be between 0 and 100"),
  minFill: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, "Min fill % must be between 0 and 100"),
  deadline: z.string().min(1, "Deadline is required"),
  mode: z.enum(['FixedRate', 'DutchAuction']),
});

type ListingFormValues = z.infer<typeof listingSchema>;

export const ListingForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      mode: 'FixedRate',
    }
  });

  const onSubmit = async (data: ListingFormValues) => {
    try {
      // Call Contract to Create Listing (Mocked for now)
      toast.success(`Creating listing for invoice ${data.invoiceId}...`);
      
      // await createListing(data);
      
      toast.success("Listing created successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create listing";
      toast.error(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Listing</CardTitle>
        <CardDescription>List your minted invoice in the marketplace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceId">Invoice ID (Token ID)</Label>
            <Input id="invoiceId" placeholder="1" {...register('invoiceId')} />
            {errors.invoiceId && <p className="text-sm text-destructive">{errors.invoiceId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mode">Listing Mode</Label>
            <select 
              id="mode" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register('mode')}
            >
              <option value="FixedRate">Fixed Rate</option>
              <option value="DutchAuction">Dutch Auction</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountRate">Discount Rate (%)</Label>
            <Input id="discountRate" type="number" step="0.1" {...register('discountRate')} />
            {errors.discountRate && <p className="text-sm text-destructive">{errors.discountRate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="minFill">Minimum Fill (%)</Label>
            <Input id="minFill" type="number" step="1" {...register('minFill')} />
            {errors.minFill && <p className="text-sm text-destructive">{errors.minFill.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Listing Deadline</Label>
            <Input id="deadline" type="datetime-local" {...register('deadline')} />
            {errors.deadline && <p className="text-sm text-destructive">{errors.deadline.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Create Listing"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
