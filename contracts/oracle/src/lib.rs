#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec};

pub use shared::RiskScoreEntry;

const SCORE_BUMP: u32 = 345600;
const MAX_HISTORY: u32 = 100;

#[contracttype]
enum DataKey {
    Operator(Address),
    Admin,
    CurrentScore(Address),
    ScoreHistory(Address),
    ScoreCounter,
}

#[derive(Clone)]
#[contracttype]
pub struct ScoreData {
    pub entries: Vec<RiskScoreEntry>,
}

#[contract]
pub struct OracleContract;

#[contractimpl]
impl OracleContract {
    pub fn __constructor(env: Env, admin: Address, operator: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .persistent()
            .set(&DataKey::Operator(operator), &());
    }

    pub fn add_operator(env: Env, operator: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        admin.require_auth();

        env.storage()
            .persistent()
            .set(&DataKey::Operator(operator), &());
    }

    pub fn submit_score(env: Env, operator: Address, buyer: Address, score: u32) {
        operator.require_auth();

        if !env.storage().persistent().has(&DataKey::Operator(operator.clone())) {
            panic!("unauthorized caller: not an operator");
        }

        if score > 100 {
            panic!("score must be between 0 and 100");
        }

        let now = env.ledger().timestamp();

        let entry = RiskScoreEntry {
            score,
            timestamp: now,
            operator: operator.clone(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::CurrentScore(buyer.clone()), &entry);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::CurrentScore(buyer.clone()), SCORE_BUMP, SCORE_BUMP);

        let mut history: ScoreData = env
            .storage()
            .persistent()
            .get(&DataKey::ScoreHistory(buyer.clone()))
            .unwrap_or(ScoreData {
                entries: Vec::new(&env),
            });

        history.entries.push_back(entry.clone());

        while history.entries.len() > MAX_HISTORY {
            let mut new_entries: Vec<RiskScoreEntry> = Vec::new(&env);
            for i in 1..history.entries.len() {
                if let Some(e) = history.entries.get(i) {
                    new_entries.push_back(e);
                }
            }
            history.entries = new_entries;
        }

        env.storage()
            .persistent()
            .set(&DataKey::ScoreHistory(buyer.clone()), &history);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::ScoreHistory(buyer.clone()), SCORE_BUMP, SCORE_BUMP);

        env.events().publish(
            (Symbol::new(&env, "ScoreSubmitted"), buyer),
            (score, now),
        );
    }

    pub fn get_risk_score(env: Env, buyer: Address) -> RiskScoreEntry {
        env.storage()
            .persistent()
            .get(&DataKey::CurrentScore(buyer))
            .expect("no score found for buyer")
    }

    pub fn score_history(env: Env, buyer: Address) -> Vec<RiskScoreEntry> {
        env.storage()
            .persistent()
            .get(&DataKey::ScoreHistory(buyer))
            .unwrap_or(ScoreData {
                entries: Vec::new(&env),
            })
            .entries
    }
}

#[cfg(test)]
mod test;
