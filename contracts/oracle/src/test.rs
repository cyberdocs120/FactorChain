extern crate std;

use soroban_sdk::testutils::{Address as _, Events as _, Ledger as _};
use soroban_sdk::{Address, Env, Vec};

use crate::{OracleContract, OracleContractClient, RiskScoreEntry};

fn setup(env: &Env) -> (OracleContractClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let operator = Address::generate(env);
    let contract_id = env.register(OracleContract, (admin.clone(), operator.clone()));
    let client = OracleContractClient::new(env, &contract_id);
    (client, admin, operator)
}

#[test]
fn test_submit_and_get_score() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin, operator) = setup(&env);
    let buyer = Address::generate(&env);

    env.ledger().set_timestamp(1000);

    client.submit_score(&operator, &buyer, &72u32);

    let entry: RiskScoreEntry = client.get_risk_score(&buyer);
    assert_eq!(entry.score, 72);
    assert_eq!(entry.timestamp, 1000);
}

#[test]
fn test_score_history() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin, operator) = setup(&env);
    let buyer = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    client.submit_score(&operator, &buyer, &50u32);

    env.ledger().set_timestamp(2000);
    client.submit_score(&operator, &buyer, &65u32);

    env.ledger().set_timestamp(3000);
    client.submit_score(&operator, &buyer, &80u32);

    let history: Vec<RiskScoreEntry> = client.score_history(&buyer);
    assert_eq!(history.len(), 3);

    if let Some(entry) = history.get(0) {
        assert_eq!(entry.score, 50);
    }
    if let Some(entry) = history.get(2) {
        assert_eq!(entry.score, 80);
    }
}

#[test]
#[should_panic(expected = "unauthorized caller: not an operator")]
fn test_unauthorized_submission_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin, _operator) = setup(&env);
    let buyer = Address::generate(&env);
    let imposter = Address::generate(&env);

    client.submit_score(&imposter, &buyer, &72u32);
}

#[test]
#[should_panic(expected = "score must be between 0 and 100")]
fn test_invalid_score_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin, operator) = setup(&env);
    let buyer = Address::generate(&env);

    client.submit_score(&operator, &buyer, &101u32);
}

#[test]
fn test_add_operator() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, admin, _operator) = setup(&env);
    let new_operator = Address::generate(&env);
    let buyer = Address::generate(&env);

    client.add_operator(&new_operator);

    env.ledger().set_timestamp(1000);
    client.submit_score(&new_operator, &buyer, &85u32);

    let entry: RiskScoreEntry = client.get_risk_score(&buyer);
    assert_eq!(entry.score, 85);
}

#[test]
fn test_events_emitted() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin, operator) = setup(&env);
    let buyer = Address::generate(&env);

    env.ledger().set_timestamp(1000);
    client.submit_score(&operator, &buyer, &72u32);

    let events = env.events().all();
    assert!(events.len() > 0);
}
