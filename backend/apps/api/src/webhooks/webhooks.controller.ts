import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard, CurrentUser } from '@app/common';

@ApiTags('Webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post()
  @ApiOperation({ summary: 'Register a webhook URL for event notifications' })
  async register(
    @CurrentUser() user: any,
    @Body('url') url: string,
    @Body('events') events: string[],
    @Body('secret') secret: string,
  ) {
    return this.webhooksService.registerWebhook(user.address, url, events, secret);
  }

  @Get()
  @ApiOperation({ summary: 'List registered webhooks' })
  async list(@CurrentUser() user: any) {
    return this.webhooksService.listWebhooks(user.address);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    await this.webhooksService.deleteWebhook(id, user.address);
    return { deleted: true };
  }
}
