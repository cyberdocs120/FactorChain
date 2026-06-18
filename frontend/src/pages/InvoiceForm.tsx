import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import api from '../api/client';
import { isValidStellarAddress } from '../hooks/useWallet';

const invoiceSchema = z.object({
  buyer: z.string().refine((val) => isValidStellarAddress(val), "Invalid Stellar address format"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0"),
  dueDate: z.string().min(1, "Due date is required"),
  file: z.any().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const InvoiceForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
  });

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      // 1. Upload to IPFS (via backend)
      const formData = new FormData();
      if (data.file?.[0]) {
        formData.append('file', data.file[0]);
      }
      formData.append('buyer', data.buyer);
      formData.append('amount', data.amount);
      formData.append('dueDate', data.dueDate);

      const uploadRes = await api.post('/invoices/upload', formData);
      const { cid } = uploadRes.data;

      // 2. Call Contract to Mint (Mocked for now)
      toast.success(`Invoice uploaded! CID: ${cid}. Signing mint transaction...`);
      
      // Here we would call the Soroban contract
      // const tx = await mintInvoice(data.buyer, data.amount, cid, ...);
      
      toast.success("Invoice minted successfully on-chain!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mint invoice";
      toast.error(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mint New Invoice</CardTitle>
        <CardDescription>Upload your invoice PDF and mint it as an NFT on Soroban.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buyer">Buyer Stellar Address</Label>
            <Input id="buyer" placeholder="G..." {...register('buyer')} />
            {errors.buyer && <p className="text-sm text-destructive">{errors.buyer.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input id="amount" type="number" step="0.01" {...register('amount')} />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" {...register('dueDate')} />
            {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Invoice PDF</Label>
            <Input id="file" type="file" accept=".pdf" {...register('file')} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Mint Invoice"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
