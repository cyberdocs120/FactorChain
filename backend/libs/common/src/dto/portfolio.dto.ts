import { z } from 'zod';

export const PortfolioOverviewSchema = z.object({
  total_deployed: z.string(),
  total_returned: z.string(),
  pending_return: z.string(),
  irr_percent: z.number(),
  active_positions: z.number(),
});

export const PortfolioPositionSchema = z.object({
  escrow_id: z.string().nullable(),
  invoice_id: z.string().nullable(),
  funded_amount: z.string(),
  expected_return: z.string(),
  due_date: z.string(),
  status: z.string(),
  days_remaining: z.number().optional(),
});

export type PortfolioOverview = z.infer<typeof PortfolioOverviewSchema>;
export type PortfolioPosition = z.infer<typeof PortfolioPositionSchema>;
