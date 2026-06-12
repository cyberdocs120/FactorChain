#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol, Vec};

pub use shared::{Bid, Listing, SaleMode};

const LISTING_BUMP: u32 = 345600;

#[contracttype]
pub struct ListingEntry {
    pub listing: Listing,
    pub seller: Address,
}

#[contracttype]
enum DataKey {
    Listing(BytesN<32>),
    AcceptedBid(BytesN<32>),
}

#[contract]
pub struct MarketplaceContract;

#[contractimpl]
impl MarketplaceContract {
    pub fn create_listing(
        env: Env,
        seller: Address,
        invoice_id: BytesN<32>,
        mode: SaleMode,
        discount_rate_bps: u32,
        min_fill_pct: u32,
        deadline: u64,
    ) -> BytesN<32> {
        seller.require_auth();

        let listing_id = invoice_id.clone();

        if env.storage().persistent().has(&DataKey::Listing(listing_id.clone())) {
            panic!("listing already exists for this invoice");
        }

        if deadline <= env.ledger().timestamp() {
            panic!("deadline must be in the future");
        }

        let listing = Listing {
            invoice_id,
            mode,
            discount_rate_bps,
            min_fill_pct,
            deadline,
            bids: Vec::new(&env),
        };

        let entry = ListingEntry {
            listing,
            seller: seller.clone(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Listing(listing_id.clone()), &entry);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Listing(listing_id.clone()), LISTING_BUMP, LISTING_BUMP);

        env.events().publish(
            (Symbol::new(&env, "InvoiceListed"), listing_id.clone()),
            entry.listing,
        );

        listing_id
    }

    pub fn place_bid(
        env: Env,
        investor: Address,
        listing_id: BytesN<32>,
        amount: i128,
        rate_bps: u32,
    ) -> u32 {
        investor.require_auth();

        let mut entry: ListingEntry = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(listing_id.clone()))
            .expect("listing not found");

        if env.ledger().timestamp() >= entry.listing.deadline {
            panic!("listing has expired");
        }

        if amount <= 0 {
            panic!("bid amount must be positive");
        }

        if rate_bps > entry.listing.discount_rate_bps {
            panic!("bid rate exceeds listing discount rate");
        }

        let bid = Bid {
            investor: investor.clone(),
            amount,
            rate_bps,
        };

        entry.listing.bids.push_back(bid.clone());

        env.storage()
            .persistent()
            .set(&DataKey::Listing(listing_id.clone()), &entry);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Listing(listing_id.clone()), LISTING_BUMP, LISTING_BUMP);

        let bid_index = entry.listing.bids.len() - 1;

        env.events().publish(
            (
                Symbol::new(&env, "BidPlaced"),
                listing_id.clone(),
                investor,
            ),
            bid,
        );

        bid_index
    }

    pub fn accept_bid(env: Env, listing_id: BytesN<32>, bid_index: u32) {
        let entry: ListingEntry = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(listing_id.clone()))
            .expect("listing not found");

        entry.seller.require_auth();

        if env.ledger().timestamp() >= entry.listing.deadline {
            panic!("listing has expired");
        }

        if env.storage().persistent().has(&DataKey::AcceptedBid(listing_id.clone())) {
            panic!("bid already accepted for this listing");
        }

        let bid = entry
            .listing
            .bids
            .get(bid_index)
            .expect("bid not found at index");

        let bid_investor = bid.investor.clone();

        env.storage()
            .persistent()
            .set(&DataKey::AcceptedBid(listing_id.clone()), &bid_index);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::AcceptedBid(listing_id.clone()), LISTING_BUMP, LISTING_BUMP);

        env.events().publish(
            (
                Symbol::new(&env, "BidAccepted"),
                listing_id.clone(),
                bid_investor,
            ),
            (bid_index, bid),
        );
    }

    pub fn cancel_listing(env: Env, listing_id: BytesN<32>) {
        let entry: ListingEntry = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(listing_id.clone()))
            .expect("listing not found");

        entry.seller.require_auth();

        if env.storage().persistent().has(&DataKey::AcceptedBid(listing_id.clone())) {
            panic!("cannot cancel listing with accepted bid");
        }

        env.events().publish(
            (Symbol::new(&env, "ListingCancelled"), listing_id.clone()),
            entry.listing,
        );

        env.storage().persistent().remove(&DataKey::Listing(listing_id));
    }

    pub fn get_listing(env: Env, listing_id: BytesN<32>) -> Listing {
        let entry: ListingEntry = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(listing_id))
            .expect("listing not found");
        entry.listing
    }

    pub fn get_accepted_bid(env: Env, listing_id: BytesN<32>) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::AcceptedBid(listing_id))
            .expect("no accepted bid for this listing")
    }
}

#[cfg(test)]
mod test;
