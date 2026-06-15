extern crate std;

use soroban_sdk::testutils::{Address as _, Events as _, Ledger as _};
use soroban_sdk::{Address, BytesN, Env};

use crate::{LiquidityPool, LiquidityPoolClient, PoolConfig, PoolState, Position};

fn make_doc_hash(env: &Env, val: u8) -> BytesN<32> {
    let mut arr = [0u8; 32];
    arr[0] = val;
    BytesN::from_array(env, &arr)
}

fn default_config() -> PoolConfig {
    PoolConfig {
        max_invoice_size: 100_000_000_000,
        min_discount_rate_bps: 100,
        max_tenor_days: 90,
        max_single_buyer_exposure_pct: 20,
    }
}

fn setup(env: &Env) -> (LiquidityPoolClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register(LiquidityPool, (admin.clone(), default_config()));
    let client = LiquidityPoolClient::new(env, &contract_id);
    (client, admin)
}

#[test]
fn test_deposit_and_get_position() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let investor = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    client.deposit(&investor, &1_000_000_000i128);

    let state: PoolState = client.get_pool_state();
    assert_eq!(state.total_deposits, 1_000_000_000);
    assert_eq!(state.deployed_capital, 0);

    let position: Position = client.get_position(&investor);
    assert_eq!(position.deposited, 1_000_000_000);
    assert!(position.shares > 0);
}

#[test]
fn test_deposit_and_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let investor = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    client.deposit(&investor, &1_000_000_000i128);

    let position: Position = client.get_position(&investor);
    client.withdraw(&investor, &position.shares);

    let state: PoolState = client.get_pool_state();
    assert_eq!(state.total_deposits, 0);

    let position: Position = client.get_position(&investor);
    assert_eq!(position.shares, 0);
}

#[test]
#[should_panic(expected = "deposit amount must be positive")]
fn test_zero_deposit_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let investor = Address::generate(&env);

    client.deposit(&investor, &0i128);
}

#[test]
#[should_panic(expected = "insufficient shares")]
fn test_withdraw_more_than_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let investor = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    client.deposit(&investor, &1_000_000_000i128);
    client.withdraw(&investor, &999_999_999_999i128);
}

#[test]
fn test_auto_fund_eligible_invoice() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let investor = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    client.deposit(&investor, &10_000_000_000i128);

    let invoice_id = make_doc_hash(&env, 1);
    client.auto_fund(&invoice_id, &5_000_000_000i128, &200u32, &60u32);

    let state: PoolState = client.get_pool_state();
    assert_eq!(state.deployed_capital, 5_000_000_000);
    assert!(state.pending_returns > 5_000_000_000);
}

#[test]
#[should_panic(expected = "invoice exceeds max pool size")]
fn test_auto_fund_oversized_invoice_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let investor = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    client.deposit(&investor, &10_000_000_000i128);

    let invoice_id = make_doc_hash(&env, 1);
    client.auto_fund(&invoice_id, &200_000_000_000i128, &200u32, &60u32);
}

#[test]
#[should_panic(expected = "discount rate below pool minimum")]
fn test_auto_fund_low_rate_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let investor = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    client.deposit(&investor, &10_000_000_000i128);

    let invoice_id = make_doc_hash(&env, 1);
    client.auto_fund(&invoice_id, &5_000_000_000i128, &50u32, &60u32);
}

#[test]
#[should_panic(expected = "tenor exceeds pool maximum")]
fn test_auto_fund_long_tenor_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let investor = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    client.deposit(&investor, &10_000_000_000i128);

    let invoice_id = make_doc_hash(&env, 1);
    client.auto_fund(&invoice_id, &5_000_000_000i128, &200u32, &200u32);
}

#[test]
#[should_panic(expected = "insufficient pool liquidity")]
fn test_auto_fund_insufficient_liquidity() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let investor = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    client.deposit(&investor, &1_000_000_000i128);

    let invoice_id = make_doc_hash(&env, 1);
    client.auto_fund(&invoice_id, &10_000_000_000i128, &200u32, &60u32);
}

#[test]
fn test_events_emitted() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let investor = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    client.deposit(&investor, &1_000_000_000i128);

    let events = env.events().all();
    assert!(events.len() > 0);
}

#[test]
fn test_multiple_depositors() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin) = setup(&env);
    let investor1 = Address::generate(&env);
    let investor2 = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    client.deposit(&investor1, &1_000_000_000i128);
    client.deposit(&investor2, &2_000_000_000i128);

    let state: PoolState = client.get_pool_state();
    assert_eq!(state.total_deposits, 3_000_000_000);

    let pos1: Position = client.get_position(&investor1);
    let pos2: Position = client.get_position(&investor2);
    assert_eq!(pos1.deposited, 1_000_000_000);
    assert_eq!(pos2.deposited, 2_000_000_000);
}
