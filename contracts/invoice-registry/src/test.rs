extern crate std;

use soroban_sdk::testutils::{Address as _, Events as _, Ledger as _};
use soroban_sdk::{Address, BytesN, Env, Vec};

use crate::{InvoiceRegistry, InvoiceRegistryClient, InvoiceState, InvoiceStatus};

fn make_doc_hash(env: &Env, val: u8) -> BytesN<32> {
    let mut arr = [0u8; 32];
    arr[0] = val;
    BytesN::from_array(env, &arr)
}

#[test]
fn test_happy_path_mint_and_get() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    let contract_id = env.register(InvoiceRegistry, (admin,));
    let client = InvoiceRegistryClient::new(&env, &contract_id);

    let doc_hash = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1700000000);

    let invoice_id = client.mint_invoice(
        &seller,
        &buyer,
        &100_000_000_000i128,
        &1800000000u64,
        &doc_hash,
    );

    let invoice: InvoiceState = client.get_invoice(&invoice_id);

    assert_eq!(invoice.seller, seller);
    assert_eq!(invoice.buyer, buyer);
    assert_eq!(invoice.face_value, 100_000_000_000);
    assert_eq!(invoice.due_date, 1800000000);
    assert_eq!(invoice.doc_hash, doc_hash);
    assert!(matches!(invoice.status, InvoiceStatus::Draft));
    assert_eq!(invoice.created_at, 1700000000);
}

#[test]
#[should_panic(expected = "invoice already exists for this document hash")]
fn test_double_financing_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    let contract_id = env.register(InvoiceRegistry, (admin,));
    let client = InvoiceRegistryClient::new(&env, &contract_id);

    let doc_hash = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1700000000);

    client.mint_invoice(&seller, &buyer, &100_000_000_000i128, &1800000000u64, &doc_hash);
    client.mint_invoice(&seller, &buyer, &100_000_000_000i128, &1800000000u64, &doc_hash);
}

#[test]
fn test_update_status_by_seller() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    let contract_id = env.register(InvoiceRegistry, (admin,));
    let client = InvoiceRegistryClient::new(&env, &contract_id);

    let doc_hash = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1700000000);

    let invoice_id = client.mint_invoice(
        &seller,
        &buyer,
        &100_000_000_000i128,
        &1800000000u64,
        &doc_hash,
    );

    client.update_status(&invoice_id, &InvoiceStatus::Listed);

    let invoice: InvoiceState = client.get_invoice(&invoice_id);
    assert!(matches!(invoice.status, InvoiceStatus::Listed));
}

#[test]
fn test_verify_document() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    let contract_id = env.register(InvoiceRegistry, (admin,));
    let client = InvoiceRegistryClient::new(&env, &contract_id);

    let doc_hash = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1700000000);

    let invoice_id = client.mint_invoice(
        &seller,
        &buyer,
        &100_000_000_000i128,
        &1800000000u64,
        &doc_hash,
    );

    assert!(client.verify_document(&invoice_id, &doc_hash));

    let wrong_hash = make_doc_hash(&env, 2);
    assert!(!client.verify_document(&invoice_id, &wrong_hash));
}

#[test]
fn test_list_by_seller_pagination() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    let contract_id = env.register(InvoiceRegistry, (admin,));
    let client = InvoiceRegistryClient::new(&env, &contract_id);

    env.ledger().set_timestamp(1700000000);

    for i in 0u8..3 {
        let doc_hash = make_doc_hash(&env, i + 1);
        client.mint_invoice(
            &seller,
            &buyer,
            &(100_000_000_000i128 * (i as i128 + 1)),
            &1800000000u64,
            &doc_hash,
        );
    }

    let page1: Vec<InvoiceState> = client.list_by_seller(&seller, &1u32, &2u32);
    assert_eq!(page1.len(), 2);

    let page2: Vec<InvoiceState> = client.list_by_seller(&seller, &2u32, &2u32);
    assert_eq!(page2.len(), 1);

    assert_eq!(page1.len() + page2.len(), 3);
}

#[test]
fn test_list_by_buyer() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    let contract_id = env.register(InvoiceRegistry, (admin,));
    let client = InvoiceRegistryClient::new(&env, &contract_id);

    env.ledger().set_timestamp(1700000000);

    let doc_hash = make_doc_hash(&env, 1);
    client.mint_invoice(&seller, &buyer, &100_000_000_000i128, &1800000000u64, &doc_hash);

    let invoices: Vec<InvoiceState> = client.list_by_buyer(&buyer, &1u32, &10u32);
    assert_eq!(invoices.len(), 1);
    assert_eq!(invoices.get(0).unwrap().buyer, buyer);
}

#[test]
fn test_add_authorized_caller() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(InvoiceRegistry, (admin,));
    let client = InvoiceRegistryClient::new(&env, &contract_id);

    let authorized = Address::generate(&env);
    client.add_authorized_caller(&authorized);
}

#[test]
fn test_events_emitted_on_mint() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    let contract_id = env.register(InvoiceRegistry, (admin,));
    let client = InvoiceRegistryClient::new(&env, &contract_id);

    let doc_hash = make_doc_hash(&env, 1);
    env.ledger().set_timestamp(1700000000);

    client.mint_invoice(&seller, &buyer, &100_000_000_000i128, &1800000000u64, &doc_hash);

    let events = env.events().all();
    assert!(events.len() > 0);
}
