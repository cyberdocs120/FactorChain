import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { EventHandler, IndexedEvent } from '../interfaces';

@Injectable()
export class EscrowHandler implements EventHandler {
  private readonly logger = new Logger(EscrowHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: IndexedEvent): Promise<void> {
    switch (event.topic) {
      case 'EscrowCreated':
        await this.handleEscrowCreated(event);
        break;
      case 'EscrowSettled':
        await this.handleEscrowSettled(event);
        break;
      case 'EscrowPartialSettled':
        await this.handleEscrowPartialSettled(event);
        break;
      case 'DefaultTriggered':
        await this.handleDefaultTriggered(event);
        break;
      default:
        this.logger.warn(`Unknown escrow event: ${event.topic}`);
    }
  }

  private async handleEscrowCreated(event: IndexedEvent) {
    const {
      escrow_id,
      invoice_id,
      buyer,
      investor,
      seller,
      amount,
      due_date,
    } = event.data;

    await this.prisma.escrow.upsert({
      where: { escrowId: escrow_id },
      update: {
        amount: BigInt(amount ?? 0),
        dueDate: new Date(Number(due_date ?? 0) * 1000),
        status: 'Active',
      },
      create: {
        escrowId: escrow_id,
        invoiceId: invoice_id,
        investor,
        seller,
        amount: BigInt(amount ?? 0),
        dueDate: new Date(Number(due_date ?? 0) * 1000),
        status: 'Active',
      },
    });

    await this.prisma.invoice.update({
      where: { invoiceId: invoice_id },
      data: { status: 'Funded' },
    });

    this.logger.log(`Escrow created: ${escrow_id}`);
  }

  private async handleEscrowSettled(event: IndexedEvent) {
    const { escrow_id, amount } = event.data;

    await this.prisma.escrow.update({
      where: { escrowId: escrow_id },
      data: { status: 'Settled', settledAt: new Date() },
    });

    await this.prisma.settlement.upsert({
      where: { escrowId: escrow_id },
      update: { amount: BigInt(amount ?? 0) },
      create: {
        escrowId: escrow_id,
        amount: BigInt(amount ?? 0),
      },
    });

    this.logger.log(`Escrow settled: ${escrow_id}`);
  }

  private async handleEscrowPartialSettled(event: IndexedEvent) {
    const { escrow_id, amount } = event.data;

    await this.prisma.escrow.update({
      where: { escrowId: escrow_id },
      data: { status: 'Settled', settledAt: new Date() },
    });

    await this.prisma.settlement.upsert({
      where: { escrowId: escrow_id },
      update: { amount: { increment: BigInt(amount ?? 0) } },
      create: {
        escrowId: escrow_id,
        amount: BigInt(amount ?? 0),
      },
    });

    this.logger.log(`Escrow partial settled: ${escrow_id}`);
  }

  private async handleDefaultTriggered(event: IndexedEvent) {
    const { escrow_id, reason } = event.data;

    await this.prisma.escrow.update({
      where: { escrowId: escrow_id },
      data: { status: 'Defaulted' },
    });

    await this.prisma.default.upsert({
      where: { escrowId: escrow_id },
      update: { reason: reason ?? 'Default triggered' },
      create: {
        escrowId: escrow_id,
        reason: reason ?? 'Default triggered',
      },
    });

    this.logger.log(`Default triggered: ${escrow_id}`);
  }
}
