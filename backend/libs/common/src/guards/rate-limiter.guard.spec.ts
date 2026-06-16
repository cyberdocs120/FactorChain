import { RateLimiterGuard } from './rate-limiter.guard';

describe('RateLimiterGuard', () => {
  let guard: RateLimiterGuard;

  beforeEach(() => {
    guard = new RateLimiterGuard(3, 1);
  });

  function createMockContext(ip: string, wallet?: string): any {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          socket: { remoteAddress: ip },
          user: wallet ? { address: wallet } : undefined,
        }),
      }),
    };
  }

  it('should allow requests within limit', () => {
    const ctx = createMockContext('127.0.0.1');
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reject requests exceeding limit', () => {
    const ctx = createMockContext('127.0.0.2');
    guard.canActivate(ctx);
    guard.canActivate(ctx);
    guard.canActivate(ctx);
    expect(() => guard.canActivate(ctx)).toThrow();
  });

  it('should use wallet address as key when available', () => {
    const ctx = createMockContext('127.0.0.3', 'GABCD1234');
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(() => guard.canActivate(ctx)).toThrow();
  });
});
