import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BuyersService } from './buyers.service';
import { JwtAuthGuard } from '@app/common';

@ApiTags('Buyers')
@Controller('buyers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BuyersController {
  constructor(private buyersService: BuyersService) {}

  @Get(':address/risk-score')
  @ApiOperation({ summary: 'Fetch buyer risk score and contributing signals' })
  async getRiskScore(@Param('address') address: string) {
    return this.buyersService.getRiskScore(address);
  }
}
