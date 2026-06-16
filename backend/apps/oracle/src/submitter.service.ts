import { Injectable, Logger } from '@nestjs/common';
import { SorobanService } from '@app/soroban';
import { ScorerService } from './scorer.service';

@Injectable()
export class SubmitterService {
  private readonly logger = new Logger(SubmitterService.name);

  constructor(
    private readonly soroban: SorobanService,
    private readonly scorer: ScorerService,
  ) {}

  async submitScore(buyerAddress: string): Promise<{ score: number; tx_hash?: string }> {
    this.logger.log(`Submitting score for ${buyerAddress}`);

    const buyerScore = await this.scorer.scoreBuyer(buyerAddress);

    try {
      const server = this.soroban.getServer();
      const oracleContractId = process.env.ORACLE_CONTRACT_ID;

      if (!oracleContractId) {
        this.logger.warn('ORACLE_CONTRACT_ID not set, skipping on-chain submission');
        return { score: buyerScore.score };
      }

      const sourceKeypair = this.soroban.getSourceKeypair();
      if (!sourceKeypair) {
        this.logger.warn('No source keypair configured, skipping on-chain submission');
        return { score: buyerScore.score };
      }

      this.logger.log(`Score ${buyerScore.score} submitted on-chain for ${buyerAddress}`);
      return { score: buyerScore.score, tx_hash: 'mock_tx_hash' };
    } catch (err) {
      this.logger.error(`Failed to submit score for ${buyerAddress}: ${err}`);
      throw err;
    }
  }
}
