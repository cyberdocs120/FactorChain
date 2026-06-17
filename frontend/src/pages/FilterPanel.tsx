import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface FilterPanelProps {
  filters: any;
  setFilters: (filters: any) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="minAmount">Min Amount (USDC)</Label>
          <Input id="minAmount" name="minAmount" type="number" value={filters.minAmount} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxAmount">Max Amount (USDC)</Label>
          <Input id="maxAmount" name="maxAmount" type="number" value={filters.maxAmount} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minRisk">Min Risk Score</Label>
          <Input id="minRisk" name="minRisk" type="number" value={filters.minRisk} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxRisk">Max Risk Score</Label>
          <Input id="maxRisk" name="maxRisk" type="number" value={filters.maxRisk} onChange={handleChange} />
        </div>
      </CardContent>
    </Card>
  );
};
