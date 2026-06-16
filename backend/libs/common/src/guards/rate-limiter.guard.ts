import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly logger = new Logger(RateLimiterGuard.name);
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(maxRequests = 100, windowMinutes = 1) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip ?? request.socket?.remoteAddress ?? 'unknown';
    const wallet = (request as any).user?.address;
    const key = wallet ? `wallet:${wallet}` : `ip:${ip}`;

    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.store.set(key, entry);
    }

    entry.count++;

    if (entry.count > this.maxRequests) {
      this.logger.warn(`Rate limit exceeded for ${key}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          retry_after_ms: entry.resetAt - now,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (this.store.size > 10000) {
      this.cleanup();
    }

    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}
