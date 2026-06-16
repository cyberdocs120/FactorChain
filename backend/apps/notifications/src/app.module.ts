import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { ListenerService } from './listener.service';
import { EmailService } from './email.service';
import { WebhookService } from './webhook.service';

@Module({
  imports: [PrismaModule],
  providers: [ListenerService, EmailService, WebhookService],
})
export class AppModule {}
