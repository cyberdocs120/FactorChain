import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StreamService } from './stream.service';
import { ProcessorService } from './processor.service';

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);

  constructor(
    private readonly streamService: StreamService,
    private readonly processor: ProcessorService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing indexer...');

    const startLedger = process.env.INDEXER_START_LEDGER
      ? parseInt(process.env.INDEXER_START_LEDGER, 10)
      : undefined;

    await this.streamService.start(
      async (event) => {
        await this.processor.process(event);
      },
      { startLedger },
    );

    this.logger.log('Indexer started');
  }
}
