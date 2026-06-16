import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { EventHandler, IndexedEvent } from '../interfaces';

@Injectable()
export class ListingHandler implements EventHandler {
  private readonly logger = new Logger(ListingHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: IndexedEvent): Promise<void> {
    switch (event.topic) {
      case 'InvoiceListed':
        await this.handleInvoiceListed(event);
        break;
      case 'BidPlaced':
        await this.handleBidPlaced(event);
        break;
      case 'BidAccepted':
        await this.handleBidAccepted(event);
        break;
      case 'ListingCancelled':
        await this.handleListingCancelled(event);
        break;
      default:
        this.logger.warn(`Unknown listing event: ${event.topic}`);
    }
  }

  private async handleInvoiceListed(event: IndexedEvent) {
    const {
      listing_id,
      invoice_id,
      mode,
      discount_rate_bps,
      min_fill_pct,
      deadline,
    } = event.data;

    await this.prisma.listing.upsert({
      where: { listingId: listing_id },
      update: {
        mode: mode ?? 'FixedRate',
        discountRateBps: Number(discount_rate_bps ?? 0),
        minFillPct: Number(min_fill_pct ?? 100),
        deadline: new Date(Number(deadline ?? 0) * 1000),
        active: true,
      },
      create: {
        listingId: listing_id,
        invoiceId: invoice_id,
        mode: mode ?? 'FixedRate',
        discountRateBps: Number(discount_rate_bps ?? 0),
        minFillPct: Number(min_fill_pct ?? 100),
        deadline: new Date(Number(deadline ?? 0) * 1000),
        active: true,
      },
    });

    await this.prisma.invoice.update({
      where: { invoiceId: invoice_id },
      data: { status: 'Listed' },
    });

    this.logger.log(`Invoice listed: ${listing_id}`);
  }

  private async handleBidPlaced(event: IndexedEvent) {
    const { bid_id, listing_id, investor, amount, rate_bps } = event.data;

    await this.prisma.user.upsert({
      where: { address: investor },
      update: {},
      create: { address: investor, role: 'Investor' },
    });

    await this.prisma.bid.upsert({
      where: { bidId: bid_id },
      update: {
        amount: BigInt(amount ?? 0),
        rateBps: Number(rate_bps ?? 0),
        status: 'Pending',
      },
      create: {
        bidId: bid_id,
        listingId: listing_id,
        investor,
        amount: BigInt(amount ?? 0),
        rateBps: Number(rate_bps ?? 0),
        status: 'Pending',
      },
    });

    this.logger.log(`Bid placed: ${bid_id} on listing ${listing_id}`);
  }

  private async handleBidAccepted(event: IndexedEvent) {
    const { bid_id, listing_id } = event.data;

    await this.prisma.bid.update({
      where: { bidId: bid_id },
      data: { status: 'Accepted' },
    });

    await this.prisma.listing.update({
      where: { listingId: listing_id },
      data: { active: false },
    });

    this.logger.log(`Bid accepted: ${bid_id}`);
  }

  private async handleListingCancelled(event: IndexedEvent) {
    const { listing_id } = event.data;

    await this.prisma.listing.update({
      where: { listingId: listing_id },
      data: { active: false },
    });

    this.logger.log(`Listing cancelled: ${listing_id}`);
  }
}
