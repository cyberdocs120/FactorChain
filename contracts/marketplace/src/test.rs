extern crate std;

use soroban_sdk::testutils::{Address as _, Ledger as _};
use soroban_sdk::{Address, BytesN, Env};

use crate::{Listing, MarketplaceContract, MarketplaceContractClient, SaleMode};

fn make_doc_hash(env: &Env, val: u8) -> BytesN<32> {
    let mut arr = [0u8; 32];
    arr[0] = val;
    BytesN::from_array(env, &arr)
}

fn setup(env: &Env) -> MarketplaceContractClient<'_> {
    let contract_id = env.register(MarketplaceContract, ());
    MarketplaceContractClient::new(env, &contract_id)
}

#[test]
fn test_happy_path_list_bid_accept() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let seller = Address::generate(&env);
    let investor = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let listing_id = client.create_listing(
        &seller,
        &invoice_id,
        &SaleMode::FixedRate,
        &250u32,
        &100u32,
        &2000u64,
    );

    assert_eq!(listing_id, invoice_id);

    let bid_index = client.place_bid(&investor, &listing_id, &50_000_000_000i128, &200u32);
    assert_eq!(bid_index, 0u32);

    client.accept_bid(&listing_id, &bid_index);

    let accepted = client.get_accepted_bid(&listing_id);
    assert_eq!(accepted, 0u32);
}

#[test]
fn test_cancel_listing() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let seller = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let listing_id = client.create_listing(
        &seller,
        &invoice_id,
        &SaleMode::FixedRate,
        &250u32,
        &100u32,
        &2000u64,
    );

    client.cancel_listing(&listing_id);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.get_listing(&listing_id);
    }));
    assert!(result.is_err());
}

#[test]
#[should_panic(expected = "listing already exists for this invoice")]
fn test_duplicate_listing_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let seller = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    client.create_listing(&seller, &invoice_id, &SaleMode::FixedRate, &250u32, &100u32, &2000u64);
    client.create_listing(&seller, &invoice_id, &SaleMode::FixedRate, &250u32, &100u32, &2000u64);
}

#[test]
#[should_panic(expected = "listing has expired")]
fn test_listing_expiry_rejects_bid() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let seller = Address::generate(&env);
    let investor = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let listing_id = client.create_listing(
        &seller,
        &invoice_id,
        &SaleMode::FixedRate,
        &250u32,
        &100u32,
        &2000u64,
    );

    env.ledger().set_timestamp(3000);

    client.place_bid(&investor, &listing_id, &50_000_000_000i128, &200u32);
}

#[test]
#[should_panic(expected = "bid rate exceeds listing discount rate")]
fn test_bid_below_reserve_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let seller = Address::generate(&env);
    let investor = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let listing_id = client.create_listing(
        &seller,
        &invoice_id,
        &SaleMode::FixedRate,
        &250u32,
        &100u32,
        &2000u64,
    );

    client.place_bid(&investor, &listing_id, &50_000_000_000i128, &300u32);
}

#[test]
#[should_panic(expected = "bid already accepted for this listing")]
fn test_double_accept_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let seller = Address::generate(&env);
    let investor = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let listing_id = client.create_listing(
        &seller,
        &invoice_id,
        &SaleMode::FixedRate,
        &250u32,
        &100u32,
        &2000u64,
    );

    let bid_index = client.place_bid(&investor, &listing_id, &50_000_000_000i128, &200u32);

    client.accept_bid(&listing_id, &bid_index);
    client.accept_bid(&listing_id, &bid_index);
}

#[test]
fn test_get_listing_returns_correct_data() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let seller = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    client.create_listing(
        &seller,
        &invoice_id,
        &SaleMode::DutchAuction,
        &500u32,
        &75u32,
        &2000u64,
    );

    let listing: Listing = client.get_listing(&invoice_id);
    assert_eq!(listing.invoice_id, invoice_id);
    assert!(matches!(listing.mode, SaleMode::DutchAuction));
    assert_eq!(listing.discount_rate_bps, 500);
    assert_eq!(listing.min_fill_pct, 75);
    assert_eq!(listing.deadline, 2000);
    assert_eq!(listing.bids.len(), 0);
}

#[test]
fn test_multiple_bids_on_listing() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let seller = Address::generate(&env);
    let investor1 = Address::generate(&env);
    let investor2 = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let listing_id = client.create_listing(
        &seller,
        &invoice_id,
        &SaleMode::FixedRate,
        &250u32,
        &100u32,
        &2000u64,
    );

    let bid1 = client.place_bid(&investor1, &listing_id, &30_000_000_000i128, &200u32);
    let bid2 = client.place_bid(&investor2, &listing_id, &40_000_000_000i128, &200u32);

    assert_eq!(bid1, 0u32);
    assert_eq!(bid2, 1u32);

    let listing: Listing = client.get_listing(&listing_id);
    assert_eq!(listing.bids.len(), 2);
}

#[test]
#[should_panic(expected = "deadline must be in the future")]
fn test_create_listing_with_past_deadline_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let seller = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    client.create_listing(&seller, &invoice_id, &SaleMode::FixedRate, &250u32, &100u32, &500u64);
}

#[test]
#[should_panic(expected = "bid amount must be positive")]
fn test_zero_amount_bid_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let seller = Address::generate(&env);
    let investor = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let listing_id = client.create_listing(
        &seller,
        &invoice_id,
        &SaleMode::FixedRate,
        &250u32,
        &100u32,
        &2000u64,
    );

    client.place_bid(&investor, &listing_id, &0i128, &200u32);
}
