import { Injectable, Logger } from '@nestjs/common';
import { ScoreProvider } from '../interfaces';

@Injectable()
export class SelfReportedProvider implements ScoreProvider {
  readonly name = 'self_reported';
  private readonly logger = new Logger(SelfReportedProvider.name);

  async fetchScore(buyerAddress: string): Promise<number> {
    this.logger.debug(`Fetching self-reported data for ${buyerAddress}`);
    return 50;
  }
}
