import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '@app/prisma';
import { SorobanModule } from '@app/soroban';
import { ScorerService } from './scorer.service';
import { SubmitterService } from './submitter.service';
import { OracleController } from './oracle.controller';
import { CreditBureauProvider } from './providers/credit-bureau.provider';
import { OnchainHistoryProvider } from './providers/onchain-history.provider';
import { SelfReportedProvider } from './providers/self-reported.provider';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, SorobanModule],
  controllers: [OracleController],
  providers: [
    ScorerService,
    SubmitterService,
    CreditBureauProvider,
    OnchainHistoryProvider,
    SelfReportedProvider,
  ],
})
export class AppModule {}
