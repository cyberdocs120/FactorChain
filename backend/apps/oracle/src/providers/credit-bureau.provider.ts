import { Injectable, Logger } from '@nestjs/common';
import { ScoreProvider } from '../interfaces';

@Injectable()
export class CreditBureauProvider implements ScoreProvider {
  readonly name = 'credit_bureau';
  private readonly logger = new Logger(CreditBureauProvider.name);

  async fetchScore(buyerAddress: string): Promise<number> {
    this.logger.debug(`Fetching credit bureau score for ${buyerAddress}`);
    const baseScore = 50 + Math.random() * 40;
    const noise = Math.random() * 10 - 5;
    return Math.max(0, Math.min(100, baseScore + noise));
  }
}
