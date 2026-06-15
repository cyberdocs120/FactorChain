#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol};

pub use shared::{EscrowState, EscrowStatus};

const ESCROW_BUMP: u32 = 345600;
const DEFAULT_GRACE_PERIOD: u64 = 86400;

#[contracttype]
enum DataKey {
    Escrow(BytesN<32>),
    EscrowCounter,
    EscrowsByInvestor(Address),
}

fn escrow_id_from_counter(env: &Env, counter: u64) -> BytesN<32> {
    let mut arr = [0u8; 32];
    let bytes = counter.to_be_bytes();
    arr[..8].copy_from_slice(&bytes);
    BytesN::from_array(env, &arr)
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn create_escrow(
        env: Env,
        invoice_id: BytesN<32>,
        buyer: Address,
        investor: Address,
        seller: Address,
        amount: i128,
        due_date: u64,
    ) -> BytesN<32> {
        investor.require_auth();

        if amount <= 0 {
            panic!("escrow amount must be positive");
        }

        if due_date <= env.ledger().timestamp() {
            panic!("due date must be in the future");
        }

        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::EscrowCounter)
            .unwrap_or(0);

        counter += 1;
        let escrow_id = escrow_id_from_counter(&env, counter);

        let now = env.ledger().timestamp();

        let escrow = EscrowState {
            invoice_id: invoice_id.clone(),
            buyer: buyer.clone(),
            investor: investor.clone(),
            seller: seller.clone(),
            amount,
            due_date,
            status: EscrowStatus::Active,
            created_at: now,
            settled_at: 0,
            grace_period_end: due_date + DEFAULT_GRACE_PERIOD,
        };

        env.storage().instance().set(&DataKey::EscrowCounter, &counter);
        env.storage().persistent().set(&DataKey::Escrow(escrow_id.clone()), &escrow);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Escrow(escrow_id.clone()), ESCROW_BUMP, ESCROW_BUMP);

        let mut investor_escrows: soroban_sdk::Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&DataKey::EscrowsByInvestor(investor.clone()))
            .unwrap_or(soroban_sdk::Vec::new(&env));
        investor_escrows.push_back(escrow_id.clone());
        env.storage()
            .persistent()
            .set(&DataKey::EscrowsByInvestor(investor.clone()), &investor_escrows);

        env.events().publish(
            (Symbol::new(&env, "EscrowCreated"), escrow_id.clone()),
            (invoice_id, investor, seller, amount, due_date),
        );

        escrow_id
    }

    pub fn settle(env: Env, escrow_id: BytesN<32>) {
        let mut escrow: EscrowState = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id.clone()))
            .expect("escrow not found");

        escrow.buyer.require_auth();

        if !matches!(escrow.status, EscrowStatus::Active) {
            panic!("escrow is not active");
        }

        escrow.status = EscrowStatus::Settled;
        escrow.settled_at = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id.clone()), &escrow);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Escrow(escrow_id.clone()), ESCROW_BUMP, ESCROW_BUMP);

        env.events().publish(
            (Symbol::new(&env, "EscrowSettled"), escrow_id.clone()),
            escrow.amount,
        );
    }

    pub fn partial_settle(env: Env, escrow_id: BytesN<32>, amount: i128) {
        let mut escrow: EscrowState = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id.clone()))
            .expect("escrow not found");

        escrow.buyer.require_auth();

        if !matches!(escrow.status, EscrowStatus::Active) {
            panic!("escrow is not active");
        }

        if amount <= 0 || amount > escrow.amount {
            panic!("invalid partial settlement amount");
        }

        escrow.amount = escrow.amount - amount;
        if escrow.amount == 0 {
            escrow.status = EscrowStatus::Settled;
            escrow.settled_at = env.ledger().timestamp();
        }

        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id.clone()), &escrow);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Escrow(escrow_id.clone()), ESCROW_BUMP, ESCROW_BUMP);

        env.events().publish(
            (Symbol::new(&env, "EscrowPartiallySettled"), escrow_id.clone()),
            amount,
        );
    }

    pub fn trigger_default(env: Env, escrow_id: BytesN<32>) {
        let mut escrow: EscrowState = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id.clone()))
            .expect("escrow not found");

        let now = env.ledger().timestamp();

        if now < escrow.grace_period_end {
            panic!("grace period has not ended");
        }

        if !matches!(escrow.status, EscrowStatus::Active) {
            panic!("escrow is not active");
        }

        escrow.status = EscrowStatus::Defaulted;

        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id.clone()), &escrow);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Escrow(escrow_id.clone()), ESCROW_BUMP, ESCROW_BUMP);

        env.events().publish(
            (Symbol::new(&env, "EscrowDefaulted"), escrow_id.clone()),
            escrow.amount,
        );
    }

    pub fn get_escrow(env: Env, escrow_id: BytesN<32>) -> EscrowState {
        env.storage()
            .persistent()
            .get(&DataKey::Escrow(escrow_id))
            .expect("escrow not found")
    }
}

#[cfg(test)]
mod test;
