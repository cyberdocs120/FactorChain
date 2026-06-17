import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ListingCard } from './ListingCard';
import { FilterPanel } from './FilterPanel';
import api from '../api/client';

export const Marketplace: React.FC = () => {
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    minRisk: '',
    maxRisk: '',
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters as any);
      const res = await api.get(`/marketplace/listings?${params.toString()}`);
      return res.data;
    },
  });

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-64">
        <FilterPanel filters={filters} setFilters={setFilters} />
      </aside>
      
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">{listings?.length || 0} listings available</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {listings?.map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
            {!listings?.length && (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                No listings found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
