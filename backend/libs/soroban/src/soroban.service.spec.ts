import { Test, TestingModule } from '@nestjs/testing';
import { SorobanService } from './soroban.service';

jest.setTimeout(30_000);

describe('SorobanService', () => {
  let service: SorobanService;

  beforeAll(() => {
    process.env.SOROBAN_RPC_URL = 'https://testnet.stellar.org';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SorobanService],
    }).compile();

    service = module.get<SorobanService>(SorobanService);
  });

  describe('callWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const result = await service.callWithRetry(async () => 'success');
      expect(result).toBe('success');
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const result = await service.callWithRetry(async () => {
        attempts++;
        if (attempts < 2) throw new Error('RPC error');
        return 'success';
      }, { retries: 2, timeoutMs: 30000 });

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should throw after all retries exhausted', async () => {
      const fn = async () => { throw new Error('persistent error'); };
      await expect(
        service.callWithRetry(fn, { retries: 1, timeoutMs: 30000 }),
      ).rejects.toThrow('persistent error');
    });
  });

  describe('contract methods', () => {
    it('should return invoice registry contract', () => {
      const contract = service.getInvoiceRegistryContract('mock_id');
      expect(contract.mint_invoice).toBeDefined();
      expect(contract.get_invoice).toBeDefined();
      expect(contract.update_status).toBeDefined();
    });

    it('should return marketplace contract', () => {
      const contract = service.getMarketplaceContract('mock_id');
      expect(contract.create_listing).toBeDefined();
      expect(contract.place_bid).toBeDefined();
      expect(contract.accept_bid).toBeDefined();
    });

    it('should return escrow contract', () => {
      const contract = service.getEscrowContract('mock_id');
      expect(contract.create_escrow).toBeDefined();
      expect(contract.settle).toBeDefined();
    });

    it('should return liquidity pool contract', () => {
      const contract = service.getLiquidityPoolContract('mock_id');
      expect(contract.deposit).toBeDefined();
      expect(contract.withdraw).toBeDefined();
    });

    it('should return oracle contract', () => {
      const contract = service.getOracleContract('mock_id');
      expect(contract.submit_score).toBeDefined();
      expect(contract.get_risk_score).toBeDefined();
    });
  });
});
