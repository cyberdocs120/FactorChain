export interface NotificationPayload {
  type: string;
  user_address: string;
  email?: string;
  data: Record<string, any>;
  timestamp: number;
}

export const NOTIFICATION_TYPES = {
  INVOICE_MINTED: 'invoice.minted',
  INVOICE_STATUS_CHANGED: 'invoice.status_changed',
  LISTING_CREATED: 'listing.created',
  BID_PLACED: 'bid.placed',
  BID_ACCEPTED: 'bid.accepted',
  LISTING_CANCELLED: 'listing.cancelled',
  ESCROW_CREATED: 'escrow.created',
  ESCROW_SETTLED: 'escrow.settled',
  DEFAULT_TRIGGERED: 'default.triggered',
  POOL_DEPOSIT: 'pool.deposit',
  POOL_WITHDRAW: 'pool.withdraw',
  SCORE_UPDATED: 'score.updated',
} as const;
