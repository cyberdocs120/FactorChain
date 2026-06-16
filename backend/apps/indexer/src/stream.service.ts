import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { SorobanService } from '@app/soroban';
import { IndexedEvent } from './interfaces';

@Injectable()
export class StreamService implements OnModuleDestroy {
  private readonly logger = new Logger(StreamService.name);
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private lastProcessedLedger: number | null = null;
  private isProcessing = false;

  constructor(private readonly soroban: SorobanService) {}

  async start(
    onEvent: (event: IndexedEvent) => Promise<void>,
    options?: { pollIntervalMs?: number; startLedger?: number },
  ) {
    const pollIntervalMs = options?.pollIntervalMs ?? 10_000;
    this.lastProcessedLedger = options?.startLedger ?? null;

    this.logger.log(`Starting indexer polling every ${pollIntervalMs}ms`);

    this.pollingInterval = setInterval(async () => {
      if (this.isProcessing) return;
      this.isProcessing = true;
      try {
        await this.poll(onEvent);
      } catch (err) {
        this.logger.error('Poll error', err);
      } finally {
        this.isProcessing = false;
      }
    }, pollIntervalMs);

    await this.poll(onEvent);
  }

  async backfill(
    fromLedger: number,
    toLedger: number,
    onEvent: (event: IndexedEvent) => Promise<void>,
  ) {
    this.logger.log(`Backfilling from ${fromLedger} to ${toLedger}`);
    for (let seq = fromLedger; seq <= toLedger; seq += 100) {
      const end = Math.min(seq + 99, toLedger);
      await this.processLedgerRange(seq, end, onEvent);
    }
  }

  private async poll(onEvent: (event: IndexedEvent) => Promise<void>) {
    try {
      const server = this.soroban.getServer();
      const latest = await server.getLatestLedger();
      const latestSeq = latest.sequence;

      if (this.lastProcessedLedger === null) {
        this.lastProcessedLedger = latestSeq - 1;
        return;
      }

      if (latestSeq <= this.lastProcessedLedger) return;

      await this.processLedgerRange(
        this.lastProcessedLedger + 1,
        latestSeq,
        onEvent,
      );
      this.lastProcessedLedger = latestSeq;
    } catch (err) {
      this.logger.error(`Poll failed: ${err}`);
    }
  }

  private async processLedgerRange(
    from: number,
    to: number,
    onEvent: (event: IndexedEvent) => Promise<void>,
  ) {
    this.logger.debug(`Processing ledgers ${from}-${to}`);
    for (let seq = from; seq <= to; seq++) {
      try {
        const ledger = await this.soroban.getServer().getLedgerEntries();
        const events = await this.soroban.getServer().getEvents({
          startLedger: seq.toString(),
        });

        for (const event of events) {
          const indexedEvent: IndexedEvent = {
            contract_address: event.contractId,
            ledger_sequence: seq,
            event_index: 0,
            topic: event.topic?.[0] ?? '',
            data: event.value ?? {},
            tx_hash: event.id ?? '',
          };
          await onEvent(indexedEvent);
        }
      } catch (err) {
        this.logger.warn(`Failed to process ledger ${seq}: ${err}`);
      }
    }
  }

  onModuleDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}
