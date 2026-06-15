import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async getSellerPortfolio(address: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { seller: address },
      include: {
        listing: true,
        escrows: {
          include: { settlement: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalFaceValue = invoices.reduce(
      (sum, inv) => sum + Number(inv.faceValue),
      0,
    );

    const fundedCount = invoices.filter(
      (inv) => inv.status === 'Funded' || inv.status === 'Settled',
    ).length;

    return {
      total_invoices: invoices.length,
      total_face_value: totalFaceValue.toFixed(2),
      funded_count: fundedCount,
      invoices: invoices.map((inv) => ({
        invoice_id: inv.invoiceId,
        buyer: inv.buyer,
        face_value: inv.faceValue.toString(),
        status: inv.status,
        due_date: inv.dueDate.toISOString(),
        funded_pct: inv.listing?.fundedPct || 0,
      })),
    };
  }

  async getInvestorPortfolio(address: string) {
    const escrows = await this.prisma.escrow.findMany({
      where: { investor: address },
      include: {
        invoice: {
          include: { listing: true },
        },
        settlement: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const positions = escrows.map((e) => {
      const discountBps = e.invoice.listing?.discountRateBps || 0;
      const expectedReturn =
        Number(e.amount) * (1 + discountBps / 10000);

      return {
        escrow_id: e.escrowId || e.id,
        invoice_id: e.invoice.invoiceId,
        funded_amount: e.amount.toString(),
        expected_return: expectedReturn.toFixed(2),
        due_date: e.dueDate.toISOString(),
        status: e.status,
        settled_at: e.settledAt?.toISOString() || null,
      };
    });

    const totalDeployed = escrows.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    const totalReturned = escrows
      .filter((e) => e.settlement)
      .reduce((sum, e) => sum + Number(e.settlement!.amount), 0);

    const pendingEscrows = escrows.filter(
      (e) => e.status === 'Active',
    );
    const pendingReturn = pendingEscrows.reduce(
      (sum, e) => {
        const discountBps = e.invoice.listing?.discountRateBps || 0;
        return sum + Number(e.amount) * (1 + discountBps / 10000);
      },
      0,
    );

    const realizedIrr =
      totalDeployed > 0
        ? ((totalReturned - totalDeployed) / totalDeployed) * 100
        : 0;

    return {
      total_deployed: totalDeployed.toFixed(2),
      total_returned: totalReturned.toFixed(2),
      pending_return: pendingReturn.toFixed(2),
      realized_irr_pct: Math.round(realizedIrr * 10) / 10,
      positions,
    };
  }
}
