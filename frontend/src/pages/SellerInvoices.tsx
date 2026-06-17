import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import api from '../api/client';
import { useWallet } from '../hooks/useWallet';

export const SellerInvoices: React.FC = () => {
  const { address } = useWallet();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', address],
    queryFn: async () => {
      const res = await api.get(`/invoices/seller/${address}`);
      return res.data;
    },
    enabled: !!address,
  });

  if (isLoading) return <div>Loading invoices...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.map((invoice: any) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{invoice.buyer.slice(0, 6)}...{invoice.buyer.slice(-4)}</TableCell>
                <TableCell>{invoice.amount} USDC</TableCell>
                <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={invoice.status === 'Funded' ? 'success' : 'secondary'}>
                    {invoice.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!invoices?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
