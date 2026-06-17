import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import api from '../api/client';
import { useWallet } from '../hooks/useWallet';

export const BuyerPortal: React.FC = () => {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const { data: settlements, isLoading } = useQuery({
    queryKey: ['settlements', address],
    queryFn: async () => {
      const res = await api.get(`/invoices/buyer/${address}/pending`);
      return res.data;
    },
    enabled: !!address,
  });

  const settleMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      // Here we would call the Escrow contract's settle function
      // const tx = await settleEscrow(invoiceId);
      toast.success(`Settling invoice ${invoiceId}...`);
      return api.post(`/invoices/${invoiceId}/settle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      toast.success("Invoice settled successfully!");
    },
    onError: () => {
      toast.error("Failed to settle invoice.");
    }
  });

  if (isLoading) return <div>Loading settlements...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buyer Portal</h1>
        <p className="text-muted-foreground">Manage and settle your outstanding invoices.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Settlements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements?.map((s: any) => {
                const daysRemaining = Math.ceil((new Date(s.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.id}</TableCell>
                    <TableCell>{s.seller.slice(0, 6)}...{s.seller.slice(-4)}</TableCell>
                    <TableCell>{s.amount} USDC</TableCell>
                    <TableCell>{new Date(s.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={daysRemaining < 0 ? 'destructive' : daysRemaining < 7 ? 'secondary' : 'default'}>
                        {daysRemaining < 0 ? `${Math.abs(daysRemaining)} overdue` : `${daysRemaining} days`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        onClick={() => settleMutation.mutate(s.id)}
                        disabled={settleMutation.isPending}
                      >
                        Settle
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!settlements?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No pending settlements found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
