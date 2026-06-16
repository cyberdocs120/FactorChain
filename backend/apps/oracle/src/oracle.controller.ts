import { Controller, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { SubmitterService } from './submitter.service';
import { Public } from '@app/common';

@Controller('oracle')
export class OracleController {
  constructor(private readonly submitter: SubmitterService) {}

  @Public()
  @Post('rescore/:buyer_address')
  @HttpCode(HttpStatus.OK)
  async rescore(@Param('buyer_address') buyerAddress: string) {
    const result = await this.submitter.submitScore(buyerAddress);
    return {
      buyer_address: buyerAddress,
      score: result.score,
      tx_hash: result.tx_hash,
    };
  }
}
