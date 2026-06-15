import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '@app/common';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Get('listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search and filter active invoice listings' })
  @ApiQuery({ name: 'min_rate_bps', required: false, type: Number })
  @ApiQuery({ name: 'max_rate_bps', required: false, type: Number })
  @ApiQuery({ name: 'max_tenor_days', required: false, type: Number })
  @ApiQuery({ name: 'min_risk_score', required: false, type: Number })
  @ApiQuery({ name: 'max_face_value', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'page_size', required: false, type: Number })
  async getListings(
    @Query('min_rate_bps') minRateBps?: string,
    @Query('max_rate_bps') maxRateBps?: string,
    @Query('max_tenor_days') maxTenorDays?: string,
    @Query('min_risk_score') minRiskScore?: string,
    @Query('max_face_value') maxFaceValue?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.marketplaceService.getListings({
      min_rate_bps: minRateBps ? parseInt(minRateBps) : undefined,
      max_rate_bps: maxRateBps ? parseInt(maxRateBps) : undefined,
      max_tenor_days: maxTenorDays ? parseInt(maxTenorDays) : undefined,
      min_risk_score: minRiskScore ? parseInt(minRiskScore) : undefined,
      max_face_value: maxFaceValue ? parseFloat(maxFaceValue) : undefined,
      page: page ? parseInt(page) : undefined,
      page_size: pageSize ? parseInt(pageSize) : undefined,
    });
  }
}
