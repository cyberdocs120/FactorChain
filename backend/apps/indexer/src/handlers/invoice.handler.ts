import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { EventHandler, IndexedEvent } from '../interfaces';

@Injectable()
export class InvoiceHandler implements EventHandler {
  private readonly logger = new Logger(InvoiceHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: IndexedEvent): Promise<void> {
    switch (event.topic) {
      case 'InvoiceMinted':
        await this.handleInvoiceMinted(event);
        break;
      case 'InvoiceStatusChanged':
        await this.handleInvoiceStatusChanged(event);
        break;
      default:
        this.logger.warn(`Unknown invoice event topic: ${event.topic}`);
    }
  }

  private async handleInvoiceMinted(event: IndexedEvent) {
    const { seller, buyer, face_value, due_date, doc_hash, invoice_id } = event.data;

    await this.prisma.user.upsert({
      where: { address: seller },
      update: {},
      create: { address: seller, role: 'Seller' },
    });

    await this.prisma.user.upsert({
      where: { address: buyer },
      update: {},
      create: { address: buyer, role: 'Buyer' },
    });

    await this.prisma.invoice.upsert({
      where: { invoiceId: invoice_id },
      update: {
        status: 'Draft',
        faceValue: BigInt(face_value ?? 0),
        dueDate: new Date(Number(due_date ?? 0) * 1000),
        docHash: doc_hash,
      },
      create: {
        invoiceId: invoice_id,
        seller,
        buyer,
        faceValue: BigInt(face_value ?? 0),
        dueDate: new Date(Number(due_date ?? 0) * 1000),
        docHash: doc_hash,
        status: 'Draft',
      },
    });

    this.logger.log(`Invoice minted: ${invoice_id}`);
  }

  private async handleInvoiceStatusChanged(event: IndexedEvent) {
    const { invoice_id, new_status } = event.data;

    await this.prisma.invoice.update({
      where: { invoiceId: invoice_id },
      data: { status: new_status ?? 'Draft' },
    });

    this.logger.log(`Invoice ${invoice_id} status -> ${new_status}`);
  }
}
