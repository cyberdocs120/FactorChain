#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol, Vec};

pub use shared::{PoolConfig, PoolState, Position};

const POOL_BUMP: u32 = 345600;
const SHARE_DECIMALS: i128 = 1_000_0000;

#[contracttype]
enum DataKey {
    PoolConfig,
    PoolState,
    Position(Address),
    Depositors,
    Admin,
    AutoFundQueue,
}

fn multiply_div(a: i128, b: i128, c: i128) -> i128 {
    a * b / c
}

#[contract]
pub struct LiquidityPool;

#[contractimpl]
impl LiquidityPool {
    pub fn __constructor(env: Env, admin: Address, config: PoolConfig) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PoolConfig, &config);

        let state = PoolState {
            total_deposits: 0,
            deployed_capital: 0,
            pending_returns: 0,
            share_price: SHARE_DECIMALS,
        };
        env.storage().instance().set(&DataKey::PoolState, &state);
    }

    pub fn deposit(env: Env, investor: Address, amount: i128) {
        investor.require_auth();

        if amount <= 0 {
            panic!("deposit amount must be positive");
        }

        let mut state: PoolState = env
            .storage()
            .instance()
            .get(&DataKey::PoolState)
            .expect("pool not initialized");

        let mut position: Position = env
            .storage()
            .persistent()
            .get(&DataKey::Position(investor.clone()))
            .unwrap_or(Position {
                shares: 0,
                deposited: 0,
            });

        let shares = multiply_div(amount, SHARE_DECIMALS, state.share_price);

        position.shares = position.shares + shares;
        position.deposited = position.deposited + amount;
        state.total_deposits = state.total_deposits + amount;

        env.storage().instance().set(&DataKey::PoolState, &state);
        env.storage()
            .persistent()
            .set(&DataKey::Position(investor.clone()), &position);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Position(investor.clone()), POOL_BUMP, POOL_BUMP);

        let mut depositors: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::Depositors)
            .unwrap_or(Vec::new(&env));
        if position.deposited == amount {
            depositors.push_back(investor.clone());
        }
        env.storage().persistent().set(&DataKey::Depositors, &depositors);

        env.events().publish(
            (Symbol::new(&env, "PoolDeposited"), investor),
            (amount, shares),
        );
    }

    pub fn withdraw(env: Env, investor: Address, share_amount: i128) {
        investor.require_auth();

        if share_amount <= 0 {
            panic!("withdraw amount must be positive");
        }

        let mut state: PoolState = env
            .storage()
            .instance()
            .get(&DataKey::PoolState)
            .expect("pool not initialized");

        let mut position: Position = env
            .storage()
            .persistent()
            .get(&DataKey::Position(investor.clone()))
            .expect("position not found");

        if share_amount > position.shares {
            panic!("insufficient shares");
        }

        let return_amount = multiply_div(share_amount, state.share_price, SHARE_DECIMALS);

        let available = state.total_deposits - state.deployed_capital;
        if return_amount > available {
            panic!("insufficient liquidity");
        }

        position.shares = position.shares - share_amount;
        position.deposited = position.deposited - return_amount;
        state.total_deposits = state.total_deposits - return_amount;

        env.storage().instance().set(&DataKey::PoolState, &state);
        env.storage()
            .persistent()
            .set(&DataKey::Position(investor.clone()), &position);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Position(investor.clone()), POOL_BUMP, POOL_BUMP);

        env.events().publish(
            (Symbol::new(&env, "PoolWithdrawn"), investor),
            (share_amount, return_amount),
        );
    }

    pub fn auto_fund(env: Env, invoice_id: BytesN<32>, face_value: i128, discount_rate_bps: u32, tenor_days: u32) {
        let config: PoolConfig = env
            .storage()
            .instance()
            .get(&DataKey::PoolConfig)
            .expect("pool not initialized");

        if face_value > config.max_invoice_size {
            panic!("invoice exceeds max pool size");
        }

        if discount_rate_bps < config.min_discount_rate_bps {
            panic!("discount rate below pool minimum");
        }

        if tenor_days > config.max_tenor_days {
            panic!("tenor exceeds pool maximum");
        }

        let mut state: PoolState = env
            .storage()
            .instance()
            .get(&DataKey::PoolState)
            .expect("pool not initialized");

        let available = state.total_deposits - state.deployed_capital;
        if face_value > available {
            panic!("insufficient pool liquidity");
        }

        state.deployed_capital = state.deployed_capital + face_value;
        state.pending_returns = state.pending_returns + multiply_div(face_value, (10000 + discount_rate_bps) as i128, 10000);

        env.storage().instance().set(&DataKey::PoolState, &state);

        env.events().publish(
            (Symbol::new(&env, "PoolAutoFunded"), invoice_id),
            (face_value, discount_rate_bps),
        );
    }

    pub fn get_pool_state(env: Env) -> PoolState {
        env.storage()
            .instance()
            .get(&DataKey::PoolState)
            .expect("pool not initialized")
    }

    pub fn get_position(env: Env, investor: Address) -> Position {
        env.storage()
            .persistent()
            .get(&DataKey::Position(investor))
            .unwrap_or(Position {
                shares: 0,
                deposited: 0,
            })
    }

    pub fn get_config(env: Env) -> PoolConfig {
        env.storage()
            .instance()
            .get(&DataKey::PoolConfig)
            .expect("pool not initialized")
    }
}

#[cfg(test)]
mod test;
