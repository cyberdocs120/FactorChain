import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@app/prisma';
import { SorobanService } from '@app/soroban';
import { CreditBureauProvider } from './providers/credit-bureau.provider';
import { OnchainHistoryProvider } from './providers/onchain-history.provider';
import { SelfReportedProvider } from './providers/self-reported.provider';
import { ScoreSignal, BuyerScore } from './interfaces';

@Injectable()
export class ScorerService {
  private readonly logger = new Logger(ScorerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly soroban: SorobanService,
    private readonly creditBureau: CreditBureauProvider,
    private readonly onchainHistory: OnchainHistoryProvider,
    private readonly selfReported: SelfReportedProvider,
  ) {}

  @Cron('0 0 * * *')
  async dailyScoringRound() {
    this.logger.log('Starting daily scoring round');

    const buyers = await this.prisma.user.findMany({
      where: { role: 'Buyer' },
    });

    for (const buyer of buyers) {
      try {
        await this.scoreBuyer(buyer.address);
      } catch (err) {
        this.logger.error(`Failed to score ${buyer.address}: ${err}`);
      }
    }

    this.logger.log('Daily scoring round complete');
  }

  async scoreBuyer(buyerAddress: string): Promise<BuyerScore> {
    this.logger.log(`Scoring buyer: ${buyerAddress}`);

    const signals: ScoreSignal[] = [
      {
        provider: this.creditBureau.name,
        score: await this.creditBureau.fetchScore(buyerAddress),
        weight: 0.4,
      },
      {
        provider: this.onchainHistory.name,
        score: await this.onchainHistory.fetchScore(buyerAddress),
        weight: 0.4,
      },
      {
        provider: this.selfReported.name,
        score: await this.selfReported.fetchScore(buyerAddress),
        weight: 0.2,
      },
    ];

    const sortedScores = [...signals].sort((a, b) => a.score - b.score);
    const weightedMedian = this.weightedMedian(sortedScores);

    const finalScore = Math.max(0, Math.min(100, Math.round(weightedMedian)));

    const result: BuyerScore = {
      buyer_address: buyerAddress,
      score: finalScore,
      signals,
      timestamp: Math.floor(Date.now() / 1000),
    };

    this.logger.log(`Buyer ${buyerAddress} scored: ${finalScore}`);
    return result;
  }

  private weightedMedian(signals: ScoreSignal[]): number {
    const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
    let cumulativeWeight = 0;
    const midpoint = totalWeight / 2;

    for (const signal of signals) {
      cumulativeWeight += signal.weight;
      if (cumulativeWeight >= midpoint) {
        return signal.score;
      }
    }

    return signals[signals.length - 1]?.score ?? 50;
  }
}
