import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { EmailService } from './email.service';
import { WebhookService } from './webhook.service';
import { NotificationPayload, NOTIFICATION_TYPES } from './interfaces';

@Injectable()
export class ListenerService implements OnModuleInit {
  private readonly logger = new Logger(ListenerService.name);
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly webhookService: WebhookService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting notification listener...');

    this.pollingInterval = setInterval(async () => {
      await this.pollEvents();
    }, 5_000);

    this.logger.log('Notification listener started');
  }

  private async pollEvents() {
    try {
      const recentEvents = await this.prisma.$queryRawUnsafe<
        { idempotency_key: string; topic: string }[]
      >(
        `SELECT idempotency_key, topic FROM indexed_events ORDER BY idempotency_key DESC LIMIT 10`,
      );

      for (const event of recentEvents) {
        const notificationType = this.mapTopicToNotification(event.topic);
        if (!notificationType) continue;

        const payload: NotificationPayload = {
          type: notificationType,
          user_address: '',
          data: { event_key: event.idempotency_key },
          timestamp: Math.floor(Date.now() / 1000),
        };

        await this.emailService.send(payload);
        await this.webhookService.dispatch(payload);
      }
    } catch (err) {
      this.logger.debug(`No new events to process: ${err}`);
    }
  }

  private mapTopicToNotification(topic: string): string | null {
    const map: Record<string, string> = {
      InvoiceMinted: NOTIFICATION_TYPES.INVOICE_MINTED,
      InvoiceStatusChanged: NOTIFICATION_TYPES.INVOICE_STATUS_CHANGED,
      InvoiceListed: NOTIFICATION_TYPES.LISTING_CREATED,
      BidPlaced: NOTIFICATION_TYPES.BID_PLACED,
      BidAccepted: NOTIFICATION_TYPES.BID_ACCEPTED,
      ListingCancelled: NOTIFICATION_TYPES.LISTING_CANCELLED,
      EscrowCreated: NOTIFICATION_TYPES.ESCROW_CREATED,
      EscrowSettled: NOTIFICATION_TYPES.ESCROW_SETTLED,
      DefaultTriggered: NOTIFICATION_TYPES.DEFAULT_TRIGGERED,
      PoolDeposit: NOTIFICATION_TYPES.POOL_DEPOSIT,
      PoolWithdraw: NOTIFICATION_TYPES.POOL_WITHDRAW,
      ScoreSubmitted: NOTIFICATION_TYPES.SCORE_UPDATED,
    };
    return map[topic] ?? null;
  }

  async onModuleDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}
