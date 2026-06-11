#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn hello(env: Env) -> soroban_sdk::String {
        soroban_sdk::String::from_str(&env, "FactorChain: Escrow")
    }
}
