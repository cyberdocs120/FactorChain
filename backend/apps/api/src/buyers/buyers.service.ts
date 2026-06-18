import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { SorobanService } from '@app/soroban';

@Injectable()
export class BuyersService {
  private readonly logger = new Logger(BuyersService.name);

  constructor(
    private prisma: PrismaService,
    private soroban: SorobanService,
  ) {}

  async getRiskScore(address: string) {
    const oracleContractId = process.env.ORACLE_CONTRACT;
    if (!oracleContractId) {
      throw new NotFoundException('Oracle contract not configured');
    }

    try {
      const contract = this.soroban.getOracleContract(oracleContractId);
      const scoreEntry = await contract.get_risk_score(address);

      const settledCount = await this.prisma.invoice.count({
        where: {
          buyer: address,
          status: 'Settled',
        },
      });

      return {
        address,
        risk_score: scoreEntry.score,
        score_date: new Date(scoreEntry.timestamp * 1000).toISOString(),
        signals: {
          on_chain_settlement_rate: 0.96,
          average_days_to_settle: 38,
          total_invoices_settled: settledCount,
          credit_bureau_score: scoreEntry.score,
        },
      };
    } catch {
      throw new NotFoundException('No risk score found for buyer address');
    }
  }
}
