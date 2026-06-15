extern crate std;

use soroban_sdk::testutils::{Address as _, Events as _, Ledger as _};
use soroban_sdk::{Address, BytesN, Env};

use crate::{EscrowContract, EscrowContractClient, EscrowState, EscrowStatus};

fn make_doc_hash(env: &Env, val: u8) -> BytesN<32> {
    let mut arr = [0u8; 32];
    arr[0] = val;
    BytesN::from_array(env, &arr)
}

fn setup(env: &Env) -> EscrowContractClient<'_> {
    let contract_id = env.register(EscrowContract, ());
    EscrowContractClient::new(env, &contract_id)
}

#[test]
fn test_happy_path_create_and_settle() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let buyer = Address::generate(&env);
    let investor = Address::generate(&env);
    let seller = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let escrow_id = client.create_escrow(
        &invoice_id,
        &buyer,
        &investor,
        &seller,
        &50_000_000_000i128,
        &2000u64,
    );

    let escrow: EscrowState = client.get_escrow(&escrow_id);
    assert_eq!(escrow.invoice_id, invoice_id);
    assert_eq!(escrow.buyer, buyer);
    assert_eq!(escrow.investor, investor);
    assert_eq!(escrow.seller, seller);
    assert_eq!(escrow.amount, 50_000_000_000);
    assert!(matches!(escrow.status, EscrowStatus::Active));
    assert_eq!(escrow.created_at, 1000);
    assert_eq!(escrow.due_date, 2000);

    env.ledger().set_timestamp(2000);
    client.settle(&escrow_id);

    let escrow: EscrowState = client.get_escrow(&escrow_id);
    assert!(matches!(escrow.status, EscrowStatus::Settled));
    assert_eq!(escrow.settled_at, 2000);
}

#[test]
fn test_partial_settle() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let buyer = Address::generate(&env);
    let investor = Address::generate(&env);
    let seller = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let escrow_id = client.create_escrow(
        &invoice_id,
        &buyer,
        &investor,
        &seller,
        &50_000_000_000i128,
        &2000u64,
    );

    client.partial_settle(&escrow_id, &20_000_000_000i128);

    let escrow: EscrowState = client.get_escrow(&escrow_id);
    assert_eq!(escrow.amount, 30_000_000_000);
    assert!(matches!(escrow.status, EscrowStatus::Active));

    client.partial_settle(&escrow_id, &30_000_000_000i128);

    let escrow: EscrowState = client.get_escrow(&escrow_id);
    assert_eq!(escrow.amount, 0);
    assert!(matches!(escrow.status, EscrowStatus::Settled));
}

#[test]
fn test_trigger_default_after_grace_period() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let buyer = Address::generate(&env);
    let investor = Address::generate(&env);
    let seller = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let escrow_id = client.create_escrow(
        &invoice_id,
        &buyer,
        &investor,
        &seller,
        &50_000_000_000i128,
        &2000u64,
    );

    env.ledger().set_timestamp(2000 + 86400 + 1);

    client.trigger_default(&escrow_id);

    let escrow: EscrowState = client.get_escrow(&escrow_id);
    assert!(matches!(escrow.status, EscrowStatus::Defaulted));
}

#[test]
#[should_panic(expected = "escrow amount must be positive")]
fn test_zero_amount_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let buyer = Address::generate(&env);
    let investor = Address::generate(&env);
    let seller = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    client.create_escrow(
        &invoice_id,
        &buyer,
        &investor,
        &seller,
        &0i128,
        &2000u64,
    );
}

#[test]
#[should_panic(expected = "escrow is not active")]
fn test_double_settle_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let buyer = Address::generate(&env);
    let investor = Address::generate(&env);
    let seller = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let escrow_id = client.create_escrow(
        &invoice_id,
        &buyer,
        &investor,
        &seller,
        &50_000_000_000i128,
        &2000u64,
    );

    env.ledger().set_timestamp(2000);
    client.settle(&escrow_id);
    client.settle(&escrow_id);
}

#[test]
#[should_panic(expected = "grace period has not ended")]
fn test_trigger_default_before_grace_period() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let buyer = Address::generate(&env);
    let investor = Address::generate(&env);
    let seller = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    let escrow_id = client.create_escrow(
        &invoice_id,
        &buyer,
        &investor,
        &seller,
        &50_000_000_000i128,
        &2000u64,
    );

    env.ledger().set_timestamp(2000);
    client.trigger_default(&escrow_id);
}

#[test]
fn test_events_emitted() {
    let env = Env::default();
    env.mock_all_auths();

    let client = setup(&env);
    let buyer = Address::generate(&env);
    let investor = Address::generate(&env);
    let seller = Address::generate(&env);

    let invoice_id = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1000);

    client.create_escrow(
        &invoice_id,
        &buyer,
        &investor,
        &seller,
        &50_000_000_000i128,
        &2000u64,
    );

    let events = env.events().all();
    assert!(events.len() > 0);
}
