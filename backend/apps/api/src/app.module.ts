import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '@app/prisma';
import { SorobanModule } from '@app/soroban';
import { CommonModule, JwtAuthGuard, RateLimiterGuard } from '@app/common';
import { AuthModule } from './auth/auth.module';
import { InvoicesModule } from './invoices/invoices.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { BuyersModule } from './buyers/buyers.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    PrismaModule,
    SorobanModule,
    CommonModule,
    AuthModule,
    InvoicesModule,
    MarketplaceModule,
    PortfolioModule,
    WebhooksModule,
    BuyersModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
  ],
})
export class AppModule {}
