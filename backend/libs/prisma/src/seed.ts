import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const sellers = [
    { address: 'GSELLER00000000000000000000000000000001', role: 'Seller' as const, company: 'TechCorp GmbH', email: 'seller1@techcorp.io' },
    { address: 'GSELLER00000000000000000000000000000002', role: 'Seller' as const, company: 'FinancePlus AG', email: 'seller2@financeplus.com' },
    { address: 'GSELLER00000000000000000000000000000003', role: 'Seller' as const, company: 'LogisticsPro KG', email: 'seller3@logisticspro.de' },
  ];

  const buyers = [
    { address: 'GBUYER000000000000000000000000000000001', role: 'Buyer' as const, company: 'MegaCorp SE', email: 'buyer1@megacorp.de' },
    { address: 'GBUYER000000000000000000000000000000002', role: 'Buyer' as const, company: 'RetailGmbH', email: 'buyer2@retailgmbh.de' },
    { address: 'GBUYER000000000000000000000000000000003', role: 'Buyer' as const, company: 'BuildIt GmbH', email: 'buyer3@buildit.de' },
  ];

  const investors = [
    { address: 'GINVEST00000000000000000000000000000001', role: 'Investor' as const, company: 'Alpha Ventures', email: 'investor1@alphavc.io' },
    { address: 'GINVEST00000000000000000000000000000002', role: 'Investor' as const, company: 'Beta Capital', email: 'investor2@betacap.com' },
  ];

  for (const user of [...sellers, ...buyers, ...investors]) {
    await prisma.user.upsert({
      where: { address: user.address },
      update: {},
      create: user,
    });
  }

  const invoiceData = [
    {
      invoiceId: 'inv_001',
      seller: sellers[0].address,
      buyer: buyers[0].address,
      faceValue: 50000,
      dueDate: new Date('2026-07-15'),
      docHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      status: 'Listed' as const,
    },
    {
      invoiceId: 'inv_002',
      seller: sellers[0].address,
      buyer: buyers[1].address,
      faceValue: 75000,
      dueDate: new Date('2026-08-20'),
      docHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      status: 'Funded' as const,
    },
    {
      invoiceId: 'inv_003',
      seller: sellers[1].address,
      buyer: buyers[0].address,
      faceValue: 120000,
      dueDate: new Date('2026-09-10'),
      docHash: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      status: 'Listed' as const,
    },
    {
      invoiceId: 'inv_004',
      seller: sellers[1].address,
      buyer: buyers[2].address,
      faceValue: 30000,
      dueDate: new Date('2026-06-30'),
      docHash: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      status: 'Listed' as const,
    },
    {
      invoiceId: 'inv_005',
      seller: sellers[2].address,
      buyer: buyers[1].address,
      faceValue: 200000,
      dueDate: new Date('2026-10-01'),
      docHash: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      status: 'Draft' as const,
    },
    {
      invoiceId: 'inv_006',
      seller: sellers[0].address,
      buyer: buyers[2].address,
      faceValue: 85000,
      dueDate: new Date('2026-07-01'),
      docHash: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      status: 'Listed' as const,
    },
  ];

  for (const inv of invoiceData) {
    await prisma.invoice.upsert({
      where: { invoiceId: inv.invoiceId },
      update: {},
      create: {
        invoiceId: inv.invoiceId,
        seller: inv.seller,
        buyer: inv.buyer,
        faceValue: inv.faceValue,
        dueDate: inv.dueDate,
        docHash: inv.docHash,
        status: inv.status,
        ipfsUrl: `https://ipfs.io/ipfs/bafybei${inv.docHash!.substring(0, 44)}`,
      },
    });
  }

  const listings = [
    {
      listingId: 'lst_001',
      invoiceId: 'inv_001',
      mode: 'FixedRate' as const,
      discountRateBps: 150,
      minFillPct: 100,
      deadline: new Date('2026-06-30'),
      fundedPct: 0,
    },
    {
      listingId: 'lst_002',
      invoiceId: 'inv_003',
      mode: 'DutchAuction' as const,
      discountRateBps: 200,
      minFillPct: 80,
      deadline: new Date('2026-07-15'),
      fundedPct: 0,
    },
    {
      listingId: 'lst_003',
      invoiceId: 'inv_004',
      mode: 'FixedRate' as const,
      discountRateBps: 120,
      minFillPct: 100,
      deadline: new Date('2026-06-15'),
      fundedPct: 50,
    },
    {
      listingId: 'lst_004',
      invoiceId: 'inv_006',
      mode: 'FixedRate' as const,
      discountRateBps: 180,
      minFillPct: 100,
      deadline: new Date('2026-06-20'),
      fundedPct: 0,
    },
  ];

  for (const lst of listings) {
    await prisma.listing.upsert({
      where: { listingId: lst.listingId },
      update: {},
      create: lst,
    });
  }

  const escrows = [
    {
      escrowId: 'esc_001',
      invoiceId: 'inv_002',
      investor: investors[0].address,
      seller: sellers[0].address,
      amount: 75000,
      dueDate: new Date('2026-08-20'),
      status: 'Active' as const,
    },
  ];

  for (const esc of escrows) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: esc.invoiceId },
    });
    if (invoice) {
      await prisma.escrow.upsert({
        where: { escrowId: esc.escrowId },
        update: {},
        create: {
          escrowId: esc.escrowId,
          invoiceId: invoice.id,
          investor: esc.investor,
          seller: esc.seller,
          amount: esc.amount,
          dueDate: esc.dueDate,
          status: esc.status,
        },
      });
    }
  }

  const poolPositions = [
    {
      investor: investors[0].address,
      amount: 500000,
      shareAmount: 500000,
    },
    {
      investor: investors[1].address,
      amount: 250000,
      shareAmount: 250000,
    },
  ];

  for (const pos of poolPositions) {
    await prisma.poolPosition.upsert({
      where: { id: `${pos.investor}-seed` },
      update: {},
      create: pos,
    });
  }

  const webhooks = [
    {
      url: 'https://example.com/webhooks/factorchain',
      events: ['invoice.minted', 'escrow.settled', 'default.triggered'],
      secret: 'whsec_test1234567890abcdef',
      userAddress: investors[0].address,
    },
  ];

  for (const wh of webhooks) {
    await prisma.webhook.create({ data: wh });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
