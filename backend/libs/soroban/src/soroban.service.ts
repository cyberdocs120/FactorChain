import { Injectable, Logger } from '@nestjs/common';
import { SorobanRpc, Keypair } from '@stellar/stellar-sdk';
import {
  InvoiceRegistryContract,
  MarketplaceContract,
  EscrowContract,
  LiquidityPoolContract,
  OracleContract,
  ContractCallOptions,
} from './contract-types';

@Injectable()
export class SorobanService {
  private readonly logger = new Logger(SorobanService.name);
  private client: SorobanRpc.Server;
  private sourceKeypair: Keypair | null = null;

  constructor() {
    const rpcUrl = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    this.client = new SorobanRpc.Server(rpcUrl);

    const secretKey = process.env.SOROBAN_SECRET_KEY;
    if (secretKey) {
      try {
        this.sourceKeypair = Keypair.fromSecret(secretKey);
      } catch {
        this.logger.warn('Invalid SOROBAN_SECRET_KEY');
      }
    }

    this.logger.log(`Soroban client initialized for ${rpcUrl}`);
  }

  getServer(): SorobanRpc.Server {
    return this.client;
  }

  getSourceKeypair(): Keypair | null {
    return this.sourceKeypair;
  }

  async callWithRetry<T>(
    fn: () => Promise<T>,
    options?: ContractCallOptions,
  ): Promise<T> {
    const maxRetries = options?.retries ?? 3;
    const timeoutMs = options?.timeoutMs ?? 30_000;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10_000);
          this.logger.debug(`Retry ${attempt}/${maxRetries} after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const result = await Promise.race([
          fn(),
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('RPC timeout')), timeoutMs),
          ),
        ]);

        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`RPC call failed (attempt ${attempt + 1}): ${lastError.message}`);
      }
    }

    throw lastError ?? new Error('RPC call failed after all retries');
  }

  getInvoiceRegistryContract(contractId: string): InvoiceRegistryContract {
    return {
      mint_invoice: async (seller, buyer, face_value, due_date, doc_hash) =>
        this.callWithRetry(async () => {
          this.logger.log(`mint_invoice: seller=${seller}, buyer=${buyer}`);
          return 'mock_tx_hash';
        }),

      get_invoice: async (invoice_id) =>
        this.callWithRetry(async () => {
          this.logger.log(`get_invoice: ${invoice_id}`);
          return {
            seller: '',
            buyer: '',
            face_value: '0',
            due_date: 0,
            doc_hash: '',
            status: 'Draft' as const,
            created_at: Math.floor(Date.now() / 1000),
          };
        }),

      update_status: async (invoice_id, new_status) =>
        this.callWithRetry(async () => {
          this.logger.log(`update_status: ${invoice_id} -> ${new_status}`);
        }),

      verify_document: async (invoice_id, doc_hash) =>
        this.callWithRetry(async () => {
          this.logger.log(`verify_document: ${invoice_id}`);
          return true;
        }),

      list_by_seller: async (seller, page, page_size) =>
        this.callWithRetry(async () => {
          return { invoices: [], total: 0 };
        }),

      list_by_buyer: async (buyer, page, page_size) =>
        this.callWithRetry(async () => {
          return { invoices: [], total: 0 };
        }),
    };
  }

  getMarketplaceContract(contractId: string): MarketplaceContract {
    return {
      create_listing: async (invoice_id, mode, discount_rate_bps, min_fill_pct, deadline) =>
        this.callWithRetry(async () => {
          this.logger.log(`create_listing: invoice=${invoice_id}, mode=${mode}`);
          return 'mock_listing_id';
        }),

      place_bid: async (listing_id, investor, amount, rate_bps) =>
        this.callWithRetry(async () => {
          this.logger.log(`place_bid: listing=${listing_id}, investor=${investor}`);
          return 'mock_bid_id';
        }),

      accept_bid: async (listing_id, bid_id) =>
        this.callWithRetry(async () => {
          this.logger.log(`accept_bid: listing=${listing_id}, bid=${bid_id}`);
        }),

      cancel_listing: async (listing_id) =>
        this.callWithRetry(async () => {
          this.logger.log(`cancel_listing: ${listing_id}`);
        }),

      get_listing: async (listing_id) =>
        this.callWithRetry(async () => {
          return {
            invoice_id: '',
            mode: 'FixedRate' as const,
            discount_rate_bps: 0,
            min_fill_pct: 100,
            deadline: 0,
            bids: [],
          };
        }),
    };
  }

  getEscrowContract(contractId: string): EscrowContract {
    return {
      create_escrow: async (invoice_id, buyer, investor, seller, amount, due_date) =>
        this.callWithRetry(async () => {
          this.logger.log(`create_escrow: invoice=${invoice_id}`);
          return 'mock_escrow_id';
        }),

      settle: async (escrow_id) =>
        this.callWithRetry(async () => {
          this.logger.log(`settle: ${escrow_id}`);
        }),

      partial_settle: async (escrow_id, amount) =>
        this.callWithRetry(async () => {
          this.logger.log(`partial_settle: ${escrow_id}, amount=${amount}`);
        }),

      trigger_default: async (escrow_id) =>
        this.callWithRetry(async () => {
          this.logger.log(`trigger_default: ${escrow_id}`);
        }),

      get_escrow: async (escrow_id) =>
        this.callWithRetry(async () => {
          return {
            invoice_id: '',
            buyer: '',
            investor: '',
            seller: '',
            amount: '0',
            due_date: 0,
            status: 'Active' as const,
            created_at: Math.floor(Date.now() / 1000),
            settled_at: 0,
            grace_period_end: 0,
          };
        }),
    };
  }

  getLiquidityPoolContract(contractId: string): LiquidityPoolContract {
    return {
      deposit: async (investor, amount) =>
        this.callWithRetry(async () => {
          this.logger.log(`deposit: investor=${investor}, amount=${amount}`);
          return 'mock_tx_hash';
        }),

      withdraw: async (investor, share_amount) =>
        this.callWithRetry(async () => {
          this.logger.log(`withdraw: investor=${investor}, shares=${share_amount}`);
        }),

      auto_fund: async (invoice_id) =>
        this.callWithRetry(async () => {
          this.logger.log(`auto_fund: invoice=${invoice_id}`);
        }),

      get_pool_state: async () =>
        this.callWithRetry(async () => {
          return {
            total_deposits: '1000000',
            deployed_capital: '500000',
            pending_returns: '25000',
            share_price: '10000000',
          };
        }),

      get_position: async (investor) =>
        this.callWithRetry(async () => {
          return { shares: '0', deposited: '0' };
        }),

      get_config: async () =>
        this.callWithRetry(async () => {
          return {
            max_invoice_size: '100000',
            min_discount_rate_bps: 100,
            max_tenor_days: 90,
            max_single_buyer_exposure_pct: 20,
          };
        }),
    };
  }

  getOracleContract(contractId: string): OracleContract {
    return {
      submit_score: async (buyer, score) =>
        this.callWithRetry(async () => {
          this.logger.log(`submit_score: buyer=${buyer}, score=${score}`);
        }),

      get_risk_score: async (buyer) =>
        this.callWithRetry(async () => {
          return {
            score: 75,
            timestamp: Math.floor(Date.now() / 1000),
            operator: process.env.ORACLE_CONTRACT_ID ?? '',
          };
        }),

      score_history: async (buyer) =>
        this.callWithRetry(async () => {
          return [];
        }),

      add_operator: async (operator) =>
        this.callWithRetry(async () => {
          this.logger.log(`add_operator: ${operator}`);
        }),
    };
  }
}
