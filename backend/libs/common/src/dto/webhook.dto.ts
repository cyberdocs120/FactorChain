import { z } from 'zod';

export const RegisterWebhookSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  events: z.array(z.string()).min(1, 'At least one event required'),
  secret: z.string().min(16, 'Secret must be at least 16 characters'),
});

export const WebhookResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
  events: z.array(z.string()),
  active: z.boolean(),
  created_at: z.string(),
});

export type RegisterWebhook = z.infer<typeof RegisterWebhookSchema>;
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;
