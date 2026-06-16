import { RegisterWebhookSchema } from './webhook.dto';

describe('RegisterWebhookSchema', () => {
  it('should accept valid webhook registration', () => {
    const result = RegisterWebhookSchema.parse({
      url: 'https://example.com/webhook',
      events: ['invoice.minted', 'escrow.settled'],
      secret: 'supersecretkey123456',
    });
    expect(result.url).toBe('https://example.com/webhook');
    expect(result.events).toHaveLength(2);
  });

  it('should reject invalid URL', () => {
    expect(() =>
      RegisterWebhookSchema.parse({
        url: 'not-a-url',
        events: ['invoice.minted'],
        secret: 'supersecretkey123456',
      }),
    ).toThrow();
  });

  it('should reject short secret', () => {
    expect(() =>
      RegisterWebhookSchema.parse({
        url: 'https://example.com/webhook',
        events: ['invoice.minted'],
        secret: 'short',
      }),
    ).toThrow();
  });

  it('should reject empty events', () => {
    expect(() =>
      RegisterWebhookSchema.parse({
        url: 'https://example.com/webhook',
        events: [],
        secret: 'supersecretkey123456',
      }),
    ).toThrow();
  });
});
