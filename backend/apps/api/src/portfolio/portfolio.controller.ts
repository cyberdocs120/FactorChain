import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard, CurrentUser } from '@app/common';

@ApiTags('Portfolio')
@Controller('portfolio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get('seller')
  @ApiOperation({ summary: 'Seller portfolio overview' })
  getSeller(@CurrentUser() user: any) {
    return this.portfolioService.getSellerPortfolio(user.address);
  }

  @Get('investor')
  @ApiOperation({ summary: 'Investor portfolio with returns and IRR' })
  getInvestor(@CurrentUser() user: any) {
    return this.portfolioService.getInvestorPortfolio(user.address);
  }
}
