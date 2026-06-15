import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async registerWebhook(
    userAddress: string,
    url: string,
    events: string[],
    secret: string,
  ) {
    const existing = await this.prisma.webhook.findFirst({
      where: { url, userAddress, active: true },
    });

    if (existing) {
      throw new ConflictException('Webhook URL already registered');
    }

    const webhook = await this.prisma.webhook.create({
      data: {
        url,
        events,
        secret,
        userAddress,
        active: true,
      },
    });

    this.logger.log(`Webhook registered: ${url} for ${userAddress}`);

    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
    };
  }

  async listWebhooks(userAddress: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { userAddress, active: true },
    });

    return webhooks.map((w) => ({
      id: w.id,
      url: w.url,
      events: w.events,
      active: w.active,
    }));
  }

  async deleteWebhook(id: string, userAddress: string) {
    await this.prisma.webhook.updateMany({
      where: { id, userAddress },
      data: { active: false },
    });
  }
}
