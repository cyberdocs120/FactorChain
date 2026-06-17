import React from 'react';
import { SellerInvoices } from './SellerInvoices';
import { InvoiceForm } from './InvoiceForm';
import { ListingForm } from './ListingForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export const SellerPortal: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seller Portal</h1>
        <p className="text-muted-foreground">Manage your invoices and create listings for investors.</p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="mint">Mint Invoice</TabsTrigger>
          <TabsTrigger value="list">Create Listing</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-4">
          <SellerInvoices />
        </TabsContent>
        <TabsContent value="mint">
          <InvoiceForm />
        </TabsContent>
        <TabsContent value="list">
          <ListingForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};
