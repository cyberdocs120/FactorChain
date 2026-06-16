import { z } from 'zod';

export const ChallengeResponseSchema = z.object({
  challenge: z.string(),
  address: z.string(),
  expires_in: z.number(),
});

export const VerifyChallengeSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  challenge: z.string().min(1, 'Challenge is required'),
  signature: z.string().min(1, 'Signature is required'),
});

export const VerifyChallengeResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>;
export type VerifyChallenge = z.infer<typeof VerifyChallengeSchema>;
export type VerifyChallengeResponse = z.infer<typeof VerifyChallengeResponseSchema>;
