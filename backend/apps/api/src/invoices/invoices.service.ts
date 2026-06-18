import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { createHash } from 'crypto';
import * as path from 'path';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private prisma: PrismaService) {}

  async uploadInvoice(file: Express.Multer.File): Promise<{
    cid: string;
    doc_hash: string;
    ipfs_url: string;
  }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are accepted');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const docHash = createHash('sha256').update(file.buffer).digest('hex');

    // TODO: Implement actual IPFS pinning via Pinata SDK.
    // Current implementation generates a mock CID from the doc hash.
    // Replace with: const pinata = new PinataSDK({ pinataApiKey, pinataSecret });
    // const result = await pinata.pinFileToIPFS(file.buffer);
    const cid = `bafybei${docHash.substring(0, 44)}`;

    return {
      cid,
      doc_hash: docHash,
      ipfs_url: `https://ipfs.io/ipfs/${cid}`,
    };
  }

  async getInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceId },
      include: {
        listing: true,
        escrows: {
          include: { settlement: true, default: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const buyerRiskScore = Math.floor(Math.random() * 30) + 60;

    return {
      invoice_id: invoice.invoiceId,
      seller: invoice.seller,
      buyer: invoice.buyer,
      face_value: invoice.faceValue.toString(),
      currency: 'USDC',
      due_date: invoice.dueDate.toISOString(),
      status: invoice.status,
      doc_hash: invoice.docHash,
      ipfs_url: invoice.ipfsUrl,
      buyer_risk_score: buyerRiskScore,
      created_at: invoice.createdAt.toISOString(),
    };
  }

  async getAllInvoices(params: { page?: number; page_size?: number }) {
    const page = params.page || 1;
    const pageSize = params.page_size || 20;
    const skip = (page - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count(),
    ]);

    return {
      data: invoices.map((inv) => ({
        invoice_id: inv.invoiceId,
        seller: inv.seller,
        buyer: inv.buyer,
        face_value: inv.faceValue.toString(),
        status: inv.status,
        created_at: inv.createdAt.toISOString(),
      })),
      total,
      page,
      page_size: pageSize,
    };
  }
}
