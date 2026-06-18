extern crate std;

use soroban_sdk::testutils::{Address as _, Events as _, Ledger as _};
use soroban_sdk::{Address, BytesN, Env};

use escrow::{EscrowContract, EscrowContractClient, EscrowState, EscrowStatus};
use invoice_registry::{InvoiceRegistry, InvoiceRegistryClient, InvoiceState, InvoiceStatus};
use liquidity_pool::{LiquidityPool, LiquidityPoolClient, PoolConfig};
use crate::{Listing, MarketplaceContract, MarketplaceContractClient, SaleMode};
use oracle::{OracleContract, OracleContractClient};

fn make_doc_hash(env: &Env, val: u8) -> BytesN<32> {
    let mut arr = [0u8; 32];
    arr[0] = val;
    BytesN::from_array(env, &arr)
}

fn setup_full(
    env: &Env,
) -> (
    InvoiceRegistryClient<'_>,
    MarketplaceContractClient<'_>,
    EscrowContractClient<'_>,
    LiquidityPoolClient<'_>,
    OracleContractClient<'_>,
    Address,
    Address,
    Address,
    Address,
) {
    let admin = Address::generate(env);
    let seller = Address::generate(env);
    let buyer = Address::generate(env);
    let investor = Address::generate(env);
    let operator = Address::generate(env);

    let invoice_registry_id = env.register(InvoiceRegistry, (admin.clone(),));
    let invoice_client = InvoiceRegistryClient::new(env, &invoice_registry_id);

    let marketplace_id = env.register(MarketplaceContract, ());
    let market_client = MarketplaceContractClient::new(env, &marketplace_id);

    let escrow_id = env.register(EscrowContract, ());
    let escrow_client = EscrowContractClient::new(env, &escrow_id);

    invoice_client.add_authorized_caller(&invoice_registry_id);
    invoice_client.add_authorized_caller(&marketplace_id);
    invoice_client.add_authorized_caller(&escrow_id);

    let pool_config = PoolConfig {
        max_invoice_size: 100_000_000_000,
        min_discount_rate_bps: 100,
        max_tenor_days: 90,
        max_single_buyer_exposure_pct: 20,
    };
    let pool_id = env.register(LiquidityPool, (admin.clone(), pool_config));
    let pool_client = LiquidityPoolClient::new(env, &pool_id);

    let oracle_id = env.register(OracleContract, (admin.clone(), operator.clone()));
    let oracle_client = OracleContractClient::new(env, &oracle_id);

    (
        invoice_client,
        market_client,
        escrow_client,
        pool_client,
        oracle_client,
        seller,
        buyer,
        investor,
        operator,
    )
}

#[test]
fn test_full_lifecycle_mint_list_bid_escrow_settle() {
    let env = Env::default();
    env.mock_all_auths();

    let (invoice, market, escrow, _pool, _oracle, seller, buyer, investor, _operator) = setup_full(&env);

    env.ledger().set_timestamp(1000);

    let doc_hash = make_doc_hash(&env, 1);
    let invoice_id = invoice.mint_invoice(
        &seller,
        &buyer,
        &100_000_000_000i128,
        &2000u64,
        &doc_hash,
    );

    invoice.update_status(&invoice_id, &InvoiceStatus::Listed);

    let inv: InvoiceState = invoice.get_invoice(&invoice_id);
    assert!(matches!(inv.status, InvoiceStatus::Listed));

    let listing_id = market.create_listing(
        &seller,
        &invoice_id,
        &SaleMode::FixedRate,
        &250u32,
        &100u32,
        &3000u64,
    );

    let bid_index = market.place_bid(&investor, &listing_id, &100_000_000_000i128, &200u32);

    market.accept_bid(&listing_id, &bid_index);

    let accepted = market.get_accepted_bid(&listing_id);
    assert_eq!(accepted, bid_index);

    let escrow_id = escrow.create_escrow(
        &invoice_id,
        &buyer,
        &investor,
        &seller,
        &100_000_000_000i128,
        &2000u64,
    );

    let escrow_state: EscrowState = escrow.get_escrow(&escrow_id);
    assert!(matches!(escrow_state.status, EscrowStatus::Active));
    assert_eq!(escrow_state.amount, 100_000_000_000);

    env.ledger().set_timestamp(2000);
    escrow.settle(&escrow_id);

    let escrow_state: EscrowState = escrow.get_escrow(&escrow_id);
    assert!(matches!(escrow_state.status, EscrowStatus::Settled));
}

#[test]
fn test_default_workflow_with_grace_period() {
    let env = Env::default();
    env.mock_all_auths();

    let (invoice, market, escrow, _pool, _oracle, seller, buyer, investor, _operator) = setup_full(&env);

    env.ledger().set_timestamp(1000);

    let doc_hash = make_doc_hash(&env, 1);
    let invoice_id = invoice.mint_invoice(
        &seller,
        &buyer,
        &100_000_000_000i128,
        &2000u64,
        &doc_hash,
    );

    invoice.update_status(&invoice_id, &InvoiceStatus::Listed);

    let listing_id = market.create_listing(
        &seller,
        &invoice_id,
        &SaleMode::FixedRate,
        &250u32,
        &100u32,
        &3000u64,
    );

    let bid_index = market.place_bid(&investor, &listing_id, &100_000_000_000i128, &200u32);
    market.accept_bid(&listing_id, &bid_index);

    let escrow_id = escrow.create_escrow(
        &invoice_id,
        &buyer,
        &investor,
        &seller,
        &100_000_000_000i128,
        &2000u64,
    );

    env.ledger().set_timestamp(2000 + 86400 + 1);
    escrow.trigger_default(&escrow_id);

    let escrow_state: EscrowState = escrow.get_escrow(&escrow_id);
    assert!(matches!(escrow_state.status, EscrowStatus::Defaulted));
}

#[test]
fn test_pool_auto_fund_with_risk_gating() {
    let env = Env::default();
    env.mock_all_auths();

    let (_invoice, _market, _escrow, pool, oracle, _seller, buyer, _investor, operator) = setup_full(&env);

    env.ledger().set_timestamp(1000);

    let investor = Address::generate(&env);
    pool.deposit(&investor, &50_000_000_000i128);

    let invoice_id = make_doc_hash(&env, 1);
    pool.auto_fund(&invoice_id, &10_000_000_000i128, &200u32, &45u32);

    let pool_state = pool.get_pool_state();
    assert_eq!(pool_state.deployed_capital, 10_000_000_000);

    env.ledger().set_timestamp(1000);
    oracle.submit_score(&operator, &buyer, &85u32);

    let score = oracle.get_risk_score(&buyer);
    assert_eq!(score.score, 85);
}

#[test]
fn test_events_through_full_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let (invoice, market, escrow, _pool, _oracle, seller, buyer, investor, _operator) = setup_full(&env);

    env.ledger().set_timestamp(1000);

    let doc_hash = make_doc_hash(&env, 1);
    let invoice_id = invoice.mint_invoice(
        &seller,
        &buyer,
        &100_000_000_000i128,
        &2000u64,
        &doc_hash,
    );

    let listing_id = market.create_listing(
        &seller,
        &invoice_id,
        &SaleMode::FixedRate,
        &250u32,
        &100u32,
        &3000u64,
    );

    let bid_index = market.place_bid(&investor, &listing_id, &100_000_000_000i128, &200u32);
    market.accept_bid(&listing_id, &bid_index);

    let escrow_id = escrow.create_escrow(
        &invoice_id,
        &buyer,
        &investor,
        &seller,
        &100_000_000_000i128,
        &2000u64,
    );

    env.ledger().set_timestamp(2000);
    escrow.settle(&escrow_id);

    let events = env.events().all();
    assert!(events.len() > 0);
}
