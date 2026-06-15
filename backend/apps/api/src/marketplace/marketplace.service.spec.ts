import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceService } from './marketplace.service';
import { PrismaService } from '@app/prisma';

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let prisma: PrismaService;

  const mockPrisma = {
    listing: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return paginated listings', async () => {
    const mockListings = [
      {
        id: '1',
        listingId: 'lst_1',
        invoiceId: 'inv_1',
        discountRateBps: 250,
        minFillPct: 100,
        deadline: new Date('2025-09-01'),
        fundedPct: 0,
        mode: 'FixedRate',
        active: true,
        createdAt: new Date(),
        invoice: {
          faceValue: 50000,
          dueDate: new Date('2025-09-01'),
        },
        bids: [],
      },
    ];

    mockPrisma.listing.findMany.mockResolvedValue(mockListings);
    mockPrisma.listing.count.mockResolvedValue(1);

    const result = await service.getListings({ page: 1, page_size: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(20);
    expect(result.data[0].discount_rate_bps).toBe(250);
  });

  it('should filter by min_rate_bps', async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    await service.getListings({ min_rate_bps: 200 });

    expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          discountRateBps: expect.objectContaining({ gte: 200 }),
        }),
      }),
    );
  });
});
