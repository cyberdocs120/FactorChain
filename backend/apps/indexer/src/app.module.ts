import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { SorobanModule } from '@app/soroban';

@Module({
  imports: [PrismaModule, SorobanModule],
})
export class AppModule {}
