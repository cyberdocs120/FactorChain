#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol, Vec};

pub use shared::{InvoiceState, InvoiceStatus};

const INVOICE_BUMP: u32 = 345600; // ~40 days
const LIST_BUMP: u32 = 345600;

#[contracttype]
pub enum DataKey {
    Invoice(BytesN<32>),
    SellerInvoices(Address),
    BuyerInvoices(Address),
    Admin,
    AuthorizedCaller(Address),
}

#[contract]
pub struct InvoiceRegistry;

#[contractimpl]
impl InvoiceRegistry {
    pub fn __constructor(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn mint_invoice(
        env: Env,
        seller: Address,
        buyer: Address,
        face_value: i128,
        due_date: u64,
        doc_hash: BytesN<32>,
    ) -> BytesN<32> {
        seller.require_auth();

        let invoice_id = doc_hash.clone();

        if env.storage().persistent().has(&DataKey::Invoice(invoice_id.clone())) {
            panic!("invoice already exists for this document hash");
        }

        let invoice = InvoiceState {
            seller: seller.clone(),
            buyer: buyer.clone(),
            face_value,
            due_date,
            doc_hash: doc_hash.clone(),
            status: InvoiceStatus::Draft,
            created_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::Invoice(invoice_id.clone()), &invoice);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Invoice(invoice_id.clone()), INVOICE_BUMP, INVOICE_BUMP);

        let mut seller_invoices: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&DataKey::SellerInvoices(seller.clone()))
            .unwrap_or(Vec::new(&env));
        seller_invoices.push_back(invoice_id.clone());
        env.storage()
            .persistent()
            .set(&DataKey::SellerInvoices(seller.clone()), &seller_invoices);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::SellerInvoices(seller.clone()), LIST_BUMP, LIST_BUMP);

        let mut buyer_invoices: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&DataKey::BuyerInvoices(buyer.clone()))
            .unwrap_or(Vec::new(&env));
        buyer_invoices.push_back(invoice_id.clone());
        env.storage()
            .persistent()
            .set(&DataKey::BuyerInvoices(buyer.clone()), &buyer_invoices);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::BuyerInvoices(buyer), LIST_BUMP, LIST_BUMP);

        env.events().publish(
            (Symbol::new(&env, "InvoiceMinted"), seller, invoice_id.clone()),
            invoice,
        );

        invoice_id
    }

    pub fn get_invoice(env: Env, invoice_id: BytesN<32>) -> InvoiceState {
        env.storage()
            .persistent()
            .get(&DataKey::Invoice(invoice_id))
            .expect("invoice not found")
    }

    pub fn update_status(env: Env, invoice_id: BytesN<32>, new_status: InvoiceStatus) {
        let mut invoice: InvoiceState = env
            .storage()
            .persistent()
            .get(&DataKey::Invoice(invoice_id.clone()))
            .expect("invoice not found");

        let caller = env.current_contract_address();
        if !env.storage().persistent().has(&DataKey::AuthorizedCaller(caller.clone())) {
            panic!("unauthorized caller: only authorized contracts can update status");
        }

        invoice.status = new_status.clone();

        env.storage()
            .persistent()
            .set(&DataKey::Invoice(invoice_id.clone()), &invoice);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Invoice(invoice_id.clone()), INVOICE_BUMP, INVOICE_BUMP);

        env.events().publish(
            (Symbol::new(&env, "InvoiceStatusChanged"), invoice_id.clone()),
            new_status,
        );
    }

    pub fn verify_document(env: Env, invoice_id: BytesN<32>, doc_hash: BytesN<32>) -> bool {
        let invoice: InvoiceState = env
            .storage()
            .persistent()
            .get(&DataKey::Invoice(invoice_id))
            .expect("invoice not found");
        invoice.doc_hash == doc_hash
    }

    pub fn list_by_seller(
        env: Env,
        seller: Address,
        page: u32,
        page_size: u32,
    ) -> Vec<InvoiceState> {
        let invoice_ids: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&DataKey::SellerInvoices(seller))
            .unwrap_or(Vec::new(&env));

        paginate_invoices(&env, invoice_ids, page, page_size)
    }

    pub fn list_by_buyer(
        env: Env,
        buyer: Address,
        page: u32,
        page_size: u32,
    ) -> Vec<InvoiceState> {
        let invoice_ids: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&DataKey::BuyerInvoices(buyer))
            .unwrap_or(Vec::new(&env));

        paginate_invoices(&env, invoice_ids, page, page_size)
    }

    pub fn add_authorized_caller(env: Env, caller: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        admin.require_auth();

        env.storage()
            .persistent()
            .set(&DataKey::AuthorizedCaller(caller), &());
    }
}

#[cfg(test)]
mod test;

fn paginate_invoices(
    env: &Env,
    invoice_ids: Vec<BytesN<32>>,
    page: u32,
    page_size: u32,
) -> Vec<InvoiceState> {
    let total = invoice_ids.len();
    if total == 0 || page == 0 || page_size == 0 {
        return Vec::new(env);
    }

    let start: u32 = (page.saturating_sub(1).saturating_mul(page_size)).min(total);
    let end: u32 = (start.saturating_add(page_size)).min(total);

    let mut result: Vec<InvoiceState> = Vec::new(env);
    for i in start..end {
        if let Some(id) = invoice_ids.get(i) {
            if let Some(invoice) = env.storage().persistent().get(&DataKey::Invoice(id)) {
                result.push_back(invoice);
            }
        }
    }
    result
}
