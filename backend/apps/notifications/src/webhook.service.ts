import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { createHmac } from 'crypto';
import { NotificationPayload } from './interfaces';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async dispatch(payload: NotificationPayload): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        userAddress: payload.user_address,
        active: true,
        events: { has: payload.type },
      },
    });

    if (webhooks.length === 0) return;

    for (const webhook of webhooks) {
      try {
        await this.sendWebhook(webhook.url, webhook.secret, payload);
      } catch (err) {
        this.logger.error(`Webhook dispatch failed to ${webhook.url}: ${err}`);
      }
    }
  }

  private async sendWebhook(
    url: string,
    secret: string,
    payload: NotificationPayload,
  ): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = createHmac('sha256', secret).update(body).digest('hex');

    this.logger.log(
      `[MOCK WEBHOOK] POST ${url} signature=${signature} body=${body}`,
    );

    if (process.env.NODE_ENV === 'test') return;
  }
}
