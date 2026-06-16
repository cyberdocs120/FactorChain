import { MarketplaceQuerySchema } from './marketplace.dto';

describe('MarketplaceQuerySchema', () => {
  it('should use defaults for empty input', () => {
    const result = MarketplaceQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(20);
  });

  it('should parse all filter fields', () => {
    const result = MarketplaceQuerySchema.parse({
      min_rate_bps: '100',
      max_rate_bps: '500',
      max_tenor_days: '90',
      min_risk_score: '60',
      max_face_value: '100000',
      status: 'Listed',
      page: '2',
      page_size: '50',
    });
    expect(result.min_rate_bps).toBe(100);
    expect(result.max_rate_bps).toBe(500);
    expect(result.max_tenor_days).toBe(90);
    expect(result.min_risk_score).toBe(60);
    expect(result.max_face_value).toBe(100000);
    expect(result.status).toBe('Listed');
    expect(result.page).toBe(2);
    expect(result.page_size).toBe(50);
  });

  it('should reject min_risk_score over 100', () => {
    expect(() =>
      MarketplaceQuerySchema.parse({ min_risk_score: '101' }),
    ).toThrow();
  });
});
