import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { SorobanModule } from '@app/soroban';
import { IndexerService } from './indexer.service';
import { StreamService } from './stream.service';
import { ProcessorService } from './processor.service';
import { InvoiceHandler } from './handlers/invoice.handler';
import { ListingHandler } from './handlers/listing.handler';
import { EscrowHandler } from './handlers/escrow.handler';
import { PoolHandler } from './handlers/pool.handler';

@Module({
  imports: [PrismaModule, SorobanModule],
  providers: [
    IndexerService,
    StreamService,
    ProcessorService,
    InvoiceHandler,
    ListingHandler,
    EscrowHandler,
    PoolHandler,
  ],
})
export class AppModule {}
