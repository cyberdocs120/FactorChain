import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '@app/prisma';
import { SorobanModule } from '@app/soroban';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, SorobanModule],
})
export class AppModule {}
