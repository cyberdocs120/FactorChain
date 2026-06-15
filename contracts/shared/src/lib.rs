#![no_std]
use soroban_sdk::{contracttype, Address, BytesN, Vec};

#[derive(Clone)]
#[contracttype]
pub struct InvoiceState {
    pub seller: Address,
    pub buyer: Address,
    pub face_value: i128,
    pub due_date: u64,
    pub doc_hash: BytesN<32>,
    pub status: InvoiceStatus,
    pub created_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub enum InvoiceStatus {
    Draft,
    Listed,
    Funded,
    Settled,
    Defaulted,
}

#[derive(Clone)]
#[contracttype]
pub struct Listing {
    pub invoice_id: BytesN<32>,
    pub mode: SaleMode,
    pub discount_rate_bps: u32,
    pub min_fill_pct: u32,
    pub deadline: u64,
    pub bids: Vec<Bid>,
}

#[derive(Clone)]
#[contracttype]
pub enum SaleMode {
    DutchAuction,
    FixedRate,
}

#[derive(Clone)]
#[contracttype]
pub struct Bid {
    pub investor: Address,
    pub amount: i128,
    pub rate_bps: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct PoolConfig {
    pub max_invoice_size: i128,
    pub min_discount_rate_bps: u32,
    pub max_tenor_days: u32,
    pub max_single_buyer_exposure_pct: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct EscrowState {
    pub invoice_id: BytesN<32>,
    pub buyer: Address,
    pub investor: Address,
    pub seller: Address,
    pub amount: i128,
    pub due_date: u64,
    pub status: EscrowStatus,
    pub created_at: u64,
    pub settled_at: u64,
    pub grace_period_end: u64,
}

#[derive(Clone)]
#[contracttype]
pub enum EscrowStatus {
    Active,
    Settled,
    Defaulted,
}

#[derive(Clone)]
#[contracttype]
pub struct PoolState {
    pub total_deposits: i128,
    pub deployed_capital: i128,
    pub pending_returns: i128,
    pub share_price: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct Position {
    pub shares: i128,
    pub deposited: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct RiskScoreEntry {
    pub score: u32,
    pub timestamp: u64,
    pub operator: Address,
}
