import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import api from '../api/client';

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    },
  });

  const { data: riskScores } = useQuery({
    queryKey: ['admin-risk-scores'],
    queryFn: async () => {
      const res = await api.get('/admin/risk-scores');
      return res.data;
    },
  });

  const rescoreMutation = useMutation({
    mutationFn: async (buyerAddress: string) => {
      return api.post(`/oracle/rescore/${buyerAddress}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-risk-scores'] });
      toast.success("Re-score triggered successfully!");
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">System-wide monitoring and risk management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVolume || 0} USDC</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Escrows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeEscrows || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.defaultRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buyer Risk Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer Address</TableHead>
                <TableHead>Current Score</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Signals</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riskScores?.map((r: any) => (
                <TableRow key={r.address}>
                  <TableCell className="font-medium">{r.address.slice(0, 10)}...</TableCell>
                  <TableCell>
                    <Badge variant={r.score > 80 ? 'success' : r.score > 50 ? 'secondary' : 'destructive'}>
                      {r.score}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(r.lastUpdated).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.signals?.join(', ')}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => rescoreMutation.mutate(r.address)}
                      disabled={rescoreMutation.isPending}
                    >
                      Re-score
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
