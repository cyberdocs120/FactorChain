import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { IndexedEvent, EventHandler, EVENT_TOPICS } from './interfaces';
import { InvoiceHandler } from './handlers/invoice.handler';
import { ListingHandler } from './handlers/listing.handler';
import { EscrowHandler } from './handlers/escrow.handler';
import { PoolHandler } from './handlers/pool.handler';

@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);
  private readonly handlers: Map<string, EventHandler>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceHandler: InvoiceHandler,
    private readonly listingHandler: ListingHandler,
    private readonly escrowHandler: EscrowHandler,
    private readonly poolHandler: PoolHandler,
  ) {
    this.handlers = new Map([
      [EVENT_TOPICS.INVOICE_MINTED, invoiceHandler],
      [EVENT_TOPICS.INVOICE_STATUS_CHANGED, invoiceHandler],
      [EVENT_TOPICS.INVOICE_LISTED, listingHandler],
      [EVENT_TOPICS.BID_PLACED, listingHandler],
      [EVENT_TOPICS.BID_ACCEPTED, listingHandler],
      [EVENT_TOPICS.LISTING_CANCELLED, listingHandler],
      [EVENT_TOPICS.ESCROW_CREATED, escrowHandler],
      [EVENT_TOPICS.ESCROW_SETTLED, escrowHandler],
      [EVENT_TOPICS.ESCROW_PARTIAL_SETTLED, escrowHandler],
      [EVENT_TOPICS.DEFAULT_TRIGGERED, escrowHandler],
      [EVENT_TOPICS.POOL_DEPOSIT, poolHandler],
      [EVENT_TOPICS.POOL_WITHDRAW, poolHandler],
      [EVENT_TOPICS.POOL_AUTO_FUND, poolHandler],
      [EVENT_TOPICS.SCORE_SUBMITTED, poolHandler],
    ]);
  }

  async process(event: IndexedEvent): Promise<void> {
    const idempotencyKey = this.idempotencyKey(event);

    const existing = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM indexed_events WHERE idempotency_key = $1 LIMIT 1`,
      idempotencyKey,
    );
    if (existing.length > 0) {
      this.logger.debug(`Skipping duplicate event: ${idempotencyKey}`);
      return;
    }

    const handler = this.handlers.get(event.topic);
    if (!handler) {
      this.logger.warn(`No handler for topic: ${event.topic}`);
      return;
    }

    try {
      await handler.handle(event);

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO indexed_events (idempotency_key, contract_address, ledger_sequence, event_index, topic) VALUES ($1, $2, $3, $4, $5)`,
        idempotencyKey,
        event.contract_address,
        event.ledger_sequence,
        event.event_index,
        event.topic,
      );
    } catch (err) {
      this.logger.error(`Failed to process event ${idempotencyKey}: ${err}`);
    }
  }

  private idempotencyKey(event: IndexedEvent): string {
    return `${event.contract_address}:${event.ledger_sequence}:${event.event_index}`;
  }
}
