import { VerifyChallengeSchema } from './auth.dto';

describe('VerifyChallengeSchema', () => {
  it('should accept valid verification request', () => {
    const result = VerifyChallengeSchema.parse({
      address: 'GABCDEF123456',
      challenge: 'factorchain:auth:1234567890:abcdef',
      signature: 'base64signature==',
    });
    expect(result.address).toBe('GABCDEF123456');
    expect(result.challenge).toContain('factorchain:auth:');
  });

  it('should reject empty address', () => {
    expect(() =>
      VerifyChallengeSchema.parse({
        address: '',
        challenge: 'test',
        signature: 'test',
      }),
    ).toThrow();
  });

  it('should reject empty signature', () => {
    expect(() =>
      VerifyChallengeSchema.parse({
        address: 'GABCDEF123456',
        challenge: 'test',
        signature: '',
      }),
    ).toThrow();
  });
});
