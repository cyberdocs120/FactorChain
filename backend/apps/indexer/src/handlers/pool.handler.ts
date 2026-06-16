import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { EventHandler, IndexedEvent } from '../interfaces';

@Injectable()
export class PoolHandler implements EventHandler {
  private readonly logger = new Logger(PoolHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: IndexedEvent): Promise<void> {
    switch (event.topic) {
      case 'PoolDeposit':
        await this.handlePoolDeposit(event);
        break;
      case 'PoolWithdraw':
        await this.handlePoolWithdraw(event);
        break;
      case 'PoolAutoFund':
        await this.handlePoolAutoFund(event);
        break;
      default:
        this.logger.warn(`Unknown pool event: ${event.topic}`);
    }
  }

  private async handlePoolDeposit(event: IndexedEvent) {
    const { investor, amount, share_amount } = event.data;

    await this.prisma.user.upsert({
      where: { address: investor },
      update: {},
      create: { address: investor, role: 'Investor' },
    });

    await this.prisma.poolPosition.upsert({
      where: { id: `${investor}-${event.ledger_sequence}` },
      update: {
        amount: { increment: BigInt(amount ?? 0) },
        shareAmount: { increment: BigInt(share_amount ?? 0) },
      },
      create: {
        investor,
        amount: BigInt(amount ?? 0),
        shareAmount: BigInt(share_amount ?? 0),
      },
    });

    this.logger.log(`Pool deposit: ${investor} amount=${amount}`);
  }

  private async handlePoolWithdraw(event: IndexedEvent) {
    const { investor, amount, share_amount } = event.data;

    const position = await this.prisma.poolPosition.findFirst({
      where: { investor },
    });

    if (position) {
      await this.prisma.poolPosition.update({
        where: { id: position.id },
        data: {
          amount: { decrement: BigInt(amount ?? 0) },
          shareAmount: { decrement: BigInt(share_amount ?? 0) },
        },
      });
    }

    this.logger.log(`Pool withdraw: ${investor} amount=${amount}`);
  }

  private async handlePoolAutoFund(event: IndexedEvent) {
    const { invoice_id, amount } = event.data;

    await this.prisma.invoice.update({
      where: { invoiceId: invoice_id },
      data: { status: 'Funded' },
    });

    this.logger.log(`Pool auto-funded invoice ${invoice_id} amount=${amount}`);
  }
}
