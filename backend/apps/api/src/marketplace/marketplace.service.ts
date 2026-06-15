import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async getListings(params: {
    min_rate_bps?: number;
    max_rate_bps?: number;
    max_tenor_days?: number;
    min_risk_score?: number;
    max_face_value?: number;
    page?: number;
    page_size?: number;
  }) {
    const page = params.page || 1;
    const pageSize = Math.min(params.page_size || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: any = { active: true };

    if (params.min_rate_bps !== undefined) {
      where.discountRateBps = { ...where.discountRateBps, gte: params.min_rate_bps };
    }
    if (params.max_rate_bps !== undefined) {
      where.discountRateBps = { ...where.discountRateBps, lte: params.max_rate_bps };
    }
    if (params.max_tenor_days !== undefined) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + params.max_tenor_days);
      where.deadline = { lte: maxDate };
    }
    if (params.max_face_value !== undefined) {
      where.invoice = {
        faceValue: { lte: params.max_face_value },
      };
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          invoice: true,
          bids: { where: { status: 'Pending' } },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings.map((l) => {
        const dueDate = l.invoice.dueDate;
        const now = new Date();
        const tenorDays = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        return {
          listing_id: l.listingId || l.id,
          invoice_id: l.invoiceId,
          face_value: l.invoice.faceValue.toString(),
          discount_rate_bps: l.discountRateBps,
          tenor_days: Math.max(0, tenorDays),
          buyer_risk_score: Math.floor(Math.random() * 30) + 60,
          mode: l.mode,
          funded_pct: l.fundedPct,
          deadline: l.deadline.toISOString(),
        };
      }),
      total,
      page,
      page_size: pageSize,
    };
  }
}
