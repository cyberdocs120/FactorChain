#![no_std]
use soroban_sdk::{contracttype, Address, BytesN, Vec};

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

#[contracttype]
pub enum InvoiceStatus {
    Draft,
    Listed,
    Funded,
    Settled,
    Defaulted,
}

#[contracttype]
pub struct Listing {
    pub invoice_id: BytesN<32>,
    pub mode: SaleMode,
    pub discount_rate_bps: u32,
    pub min_fill_pct: u32,
    pub deadline: u64,
    pub bids: Vec<Bid>,
}

#[contracttype]
pub enum SaleMode {
    DutchAuction,
    FixedRate,
}

#[contracttype]
pub struct Bid {
    pub investor: Address,
    pub amount: i128,
    pub rate_bps: u32,
}

#[contracttype]
pub struct PoolConfig {
    pub max_invoice_size: i128,
    pub min_discount_rate_bps: u32,
    pub max_tenor_days: u32,
    pub max_single_buyer_exposure_pct: u32,
}
