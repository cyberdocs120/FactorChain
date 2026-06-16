export interface IndexedEvent {
  contract_address: string;
  ledger_sequence: number;
  event_index: number;
  topic: string;
  data: Record<string, any>;
  tx_hash: string;
}

export interface EventHandler {
  handle(event: IndexedEvent): Promise<void>;
}

export const EVENT_TOPICS = {
  INVOICE_MINTED: 'InvoiceMinted',
  INVOICE_STATUS_CHANGED: 'InvoiceStatusChanged',
  INVOICE_LISTED: 'InvoiceListed',
  BID_PLACED: 'BidPlaced',
  BID_ACCEPTED: 'BidAccepted',
  LISTING_CANCELLED: 'ListingCancelled',
  ESCROW_CREATED: 'EscrowCreated',
  ESCROW_SETTLED: 'EscrowSettled',
  ESCROW_PARTIAL_SETTLED: 'EscrowPartialSettled',
  DEFAULT_TRIGGERED: 'DefaultTriggered',
  POOL_DEPOSIT: 'PoolDeposit',
  POOL_WITHDRAW: 'PoolWithdraw',
  POOL_AUTO_FUND: 'PoolAutoFund',
  SCORE_SUBMITTED: 'ScoreSubmitted',
} as const;
