import { z } from 'zod';

export const MarketplaceQuerySchema = z.object({
  min_rate_bps: z.coerce.number().int().positive().optional(),
  max_rate_bps: z.coerce.number().int().positive().optional(),
  max_tenor_days: z.coerce.number().int().positive().optional(),
  min_risk_score: z.coerce.number().int().min(0).max(100).optional(),
  max_face_value: z.coerce.number().positive().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const ListingResponseSchema = z.object({
  listing_id: z.string().nullable(),
  invoice_id: z.string().nullable(),
  seller: z.string(),
  buyer: z.string(),
  face_value: z.string(),
  currency: z.string().optional(),
  due_date: z.string(),
  discount_rate_bps: z.number(),
  min_fill_pct: z.number(),
  funded_pct: z.number(),
  mode: z.string(),
  deadline: z.string(),
  buyer_risk_score: z.number().optional(),
  status: z.string(),
  created_at: z.string(),
});

export type MarketplaceQuery = z.infer<typeof MarketplaceQuerySchema>;
export type ListingResponse = z.infer<typeof ListingResponseSchema>;
