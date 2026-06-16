import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ScoreProvider } from '../interfaces';

@Injectable()
export class OnchainHistoryProvider implements ScoreProvider {
  readonly name = 'onchain_history';
  private readonly logger = new Logger(OnchainHistoryProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetchScore(buyerAddress: string): Promise<number> {
    this.logger.debug(`Fetching on-chain history for ${buyerAddress}`);

    const settledCount = await this.prisma.escrow.count({
      where: { seller: buyerAddress, status: 'Settled' },
    });

    const defaultedCount = await this.prisma.escrow.count({
      where: { seller: buyerAddress, status: 'Defaulted' },
    });

    const total = settledCount + defaultedCount;
    if (total === 0) return 50;

    const defaultRate = defaultedCount / total;
    return Math.max(0, Math.min(100, Math.round((1 - defaultRate) * 100)));
  }
}
