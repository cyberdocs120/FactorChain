import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';

interface ListingCardProps {
  listing: any;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const fundedPercentage = (listing.fundedAmount / listing.amount) * 100;

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <Badge variant="outline">{listing.mode}</Badge>
          <Badge variant="secondary">Risk: {listing.riskScore}</Badge>
        </div>
        <CardTitle className="mt-2">{listing.amount} USDC</CardTitle>
        <p className="text-sm text-muted-foreground">Due {new Date(listing.dueDate).toLocaleDateString()}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Funded: {listing.fundedAmount} USDC</span>
            <span>{Math.round(fundedPercentage)}%</span>
          </div>
          <Progress value={fundedPercentage} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase">Yield</p>
            <p className="font-semibold">{listing.discountRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">Tenor</p>
            <p className="font-semibold">{listing.tenor} days</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 pt-6">
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  );
};
