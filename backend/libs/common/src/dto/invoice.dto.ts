import { z } from 'zod';

export const UploadInvoiceResponseSchema = z.object({
  cid: z.string(),
  doc_hash: z.string(),
  ipfs_url: z.string(),
});

export const InvoiceResponseSchema = z.object({
  invoice_id: z.string().nullable(),
  seller: z.string(),
  buyer: z.string(),
  face_value: z.string(),
  currency: z.string().optional(),
  due_date: z.string(),
  status: z.string(),
  doc_hash: z.string().nullable(),
  ipfs_url: z.string().nullable(),
  buyer_risk_score: z.number().optional(),
  created_at: z.string(),
});

export const CreateInvoiceSchema = z.object({
  seller: z.string().min(1, 'Seller address is required'),
  buyer: z.string().min(1, 'Buyer address is required'),
  face_value: z.string().regex(/^\d+$/, 'Face value must be a numeric string'),
  due_date: z.string().datetime({ message: 'Invalid due date' }),
});

export type UploadInvoiceResponse = z.infer<typeof UploadInvoiceResponseSchema>;
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
