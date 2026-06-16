export interface InvoiceState {
  seller: string;
  buyer: string;
  face_value: string;
  due_date: number;
  doc_hash: string;
  status: InvoiceStatus;
  created_at: number;
}

export type InvoiceStatus = 'Draft' | 'Listed' | 'Funded' | 'Settled' | 'Defaulted';

export interface Listing {
  invoice_id: string;
  mode: SaleMode;
  discount_rate_bps: number;
  min_fill_pct: number;
  deadline: number;
  bids: Bid[];
}

export type SaleMode = 'DutchAuction' | 'FixedRate';

export interface Bid {
  investor: string;
  amount: string;
  rate_bps: number;
}

export interface EscrowState {
  invoice_id: string;
  buyer: string;
  investor: string;
  seller: string;
  amount: string;
  due_date: number;
  status: EscrowStatus;
  created_at: number;
  settled_at: number;
  grace_period_end: number;
}

export type EscrowStatus = 'Active' | 'Settled' | 'Defaulted';

export interface PoolConfig {
  max_invoice_size: string;
  min_discount_rate_bps: number;
  max_tenor_days: number;
  max_single_buyer_exposure_pct: number;
}

export interface PoolState {
  total_deposits: string;
  deployed_capital: string;
  pending_returns: string;
  share_price: string;
}

export interface Position {
  shares: string;
  deposited: string;
}

export interface RiskScoreEntry {
  score: number;
  timestamp: number;
  operator: string;
}

export interface ContractCallOptions {
  retries?: number;
  timeoutMs?: number;
}

export interface InvoiceRegistryContract {
  mint_invoice(seller: string, buyer: string, face_value: string, due_date: number, doc_hash: string): Promise<string>;
  get_invoice(invoice_id: string): Promise<InvoiceState>;
  update_status(invoice_id: string, new_status: InvoiceStatus): Promise<void>;
  verify_document(invoice_id: string, doc_hash: string): Promise<boolean>;
  list_by_seller(seller: string, page: number, page_size: number): Promise<{ invoices: InvoiceState[]; total: number }>;
  list_by_buyer(buyer: string, page: number, page_size: number): Promise<{ invoices: InvoiceState[]; total: number }>;
}

export interface MarketplaceContract {
  create_listing(invoice_id: string, mode: SaleMode, discount_rate_bps: number, min_fill_pct: number, deadline: number): Promise<string>;
  place_bid(listing_id: string, investor: string, amount: string, rate_bps: number): Promise<string>;
  accept_bid(listing_id: string, bid_id: string): Promise<void>;
  cancel_listing(listing_id: string): Promise<void>;
  get_listing(listing_id: string): Promise<Listing>;
}

export interface EscrowContract {
  create_escrow(invoice_id: string, buyer: string, investor: string, seller: string, amount: string, due_date: number): Promise<string>;
  settle(escrow_id: string): Promise<void>;
  partial_settle(escrow_id: string, amount: string): Promise<void>;
  trigger_default(escrow_id: string): Promise<void>;
  get_escrow(escrow_id: string): Promise<EscrowState>;
}

export interface LiquidityPoolContract {
  deposit(investor: string, amount: string): Promise<string>;
  withdraw(investor: string, share_amount: string): Promise<void>;
  auto_fund(invoice_id: string): Promise<void>;
  get_pool_state(): Promise<PoolState>;
  get_position(investor: string): Promise<Position>;
  get_config(): Promise<PoolConfig>;
}

export interface OracleContract {
  submit_score(buyer: string, score: number): Promise<void>;
  get_risk_score(buyer: string): Promise<RiskScoreEntry>;
  score_history(buyer: string): Promise<RiskScoreEntry[]>;
  add_operator(operator: string): Promise<void>;
}
