#!/usr/bin/env bash
set -euo pipefail

# ─── FactorChain Testnet Seed Script ─────────────────────────────────────────
# Usage: ./scripts/seed-testnet.sh --network testnet --account factorchain-dev
#
# Mints sample invoices, creates listings, places bids, deposits to pool.
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ─── Parse arguments ──────────────────────────────────────────────────────────
NETWORK=""
ACCOUNT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --network)
      NETWORK="$2"
      shift 2
      ;;
    --account)
      ACCOUNT="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 --network <testnet|mainnet> --account <account_name>"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$NETWORK" ]]; then
  echo "Error: --network is required"
  exit 1
fi

if [[ -z "$ACCOUNT" ]]; then
  ACCOUNT="factorchain-dev"
  echo "  Using default account: ${ACCOUNT}"
fi

# ─── Load contract addresses ─────────────────────────────────────────────────
ENV_FILE="$PROJECT_ROOT/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env file not found. Run deploy.sh first."
  exit 1
fi

source "$ENV_FILE"

SELLER_ADDR=$(soroban keys address "$ACCOUNT")
echo ""
echo "🌱 Seeding test data on ${NETWORK} (account: ${SELLER_ADDR})"
echo ""

# ─── Helper: invoke contract ─────────────────────────────────────────────────
invoke() {
  local contract_id="$1"
  shift
  soroban contract invoke \
    --id "$contract_id" \
    --source-account "$(soroban keys identity "$ACCOUNT")" \
    --network "$NETWORK" \
    --fee 100000 \
    -- \
    "$@"
}

# ─── 1. Mint sample invoices ─────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Minting sample invoices"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Generate deterministic doc hashes
DOC_HASH_1="$(echo -n "invoice-001-doc" | sha256sum | cut -d' ' -f1 | tr 'a-f' 'a-f')"
DOC_HASH_2="$(echo -n "invoice-002-doc" | sha256sum | cut -d' ' -f1 | tr 'a-f' 'a-f')"
DOC_HASH_3="$(echo -n "invoice-003-doc" | sha256sum | cut -d' ' -f1 | tr 'a-f' 'a-f')"

# Generate buyer addresses (random testnet keys)
BUYER_1="GDLG6QFYAB7Y4IJL3X5G6O7P7Q4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0"
BUYER_2="GB7Y4IJL3X5G6O7P7Q4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4"

echo ""
echo "  Minting invoice 1..."
invoke "$INVOICE_REGISTRY_CONTRACT" \
  mint_invoice \
  --seller "$SELLER_ADDR" \
  --buyer "$BUYER_1" \
  --face_value 5000000000 \
  --due_date "$(date -d '+45 days' +%s)" \
  --doc_hash "$DOC_HASH_1" || echo "  ⚠️  Invoice 1 might already exist"

echo ""
echo "  Minting invoice 2..."
invoke "$INVOICE_REGISTRY_CONTRACT" \
  mint_invoice \
  --seller "$SELLER_ADDR" \
  --buyer "$BUYER_1" \
  --face_value 25000000000 \
  --due_date "$(date -d '+60 days' +%s)" \
  --doc_hash "$DOC_HASH_2" || echo "  ⚠️  Invoice 2 might already exist"

echo ""
echo "  Minting invoice 3..."
invoke "$INVOICE_REGISTRY_CONTRACT" \
  mint_invoice \
  --seller "$SELLER_ADDR" \
  --buyer "$BUYER_2" \
  --face_value 10000000000 \
  --due_date "$(date -d '+30 days' +%s)" \
  --doc_hash "$DOC_HASH_3" || echo "  ⚠️  Invoice 3 might already exist"

# ─── 2. List invoices on marketplace ─────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  2. Creating marketplace listings"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "  Listing invoice 1 (FixedRate, 250 bps)..."
invoke "$MARKETPLACE_CONTRACT" \
  create_listing \
  --seller "$SELLER_ADDR" \
  --invoice_id "$DOC_HASH_1" \
  --mode "FixedRate" \
  --discount_rate_bps 250 \
  --min_fill_pct 10000 \
  --deadline "$(date -d '+14 days' +%s)" || echo "  ⚠️  Listing 1 might already exist"

echo ""
echo "  Listing invoice 2 (DutchAuction, 500 bps)..."
invoke "$MARKETPLACE_CONTRACT" \
  create_listing \
  --seller "$SELLER_ADDR" \
  --invoice_id "$DOC_HASH_2" \
  --mode "DutchAuction" \
  --discount_rate_bps 500 \
  --min_fill_pct 5000 \
  --deadline "$(date -d '+21 days' +%s)" || echo "  ⚠️  Listing 2 might already exist"

echo ""
echo "  Listing invoice 3 (FixedRate, 150 bps)..."
invoke "$MARKETPLACE_CONTRACT" \
  create_listing \
  --seller "$SELLER_ADDR" \
  --invoice_id "$DOC_HASH_3" \
  --mode "FixedRate" \
  --discount_rate_bps 150 \
  --min_fill_pct 10000 \
  --deadline "$(date -d '+10 days' +%s)" || echo "  ⚠️  Listing 3 might already exist"

# ─── 3. Deposit to liquidity pool ────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  3. Depositing to liquidity pool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "  Depositing 100000 USDC to pool..."
invoke "$LIQUIDITY_POOL_CONTRACT" \
  deposit \
  --investor "$SELLER_ADDR" \
  --amount 10000000000 || echo "  ⚠️  Deposit might have issues"

# ─── 4. Verify state ─────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  4. Verifying seed data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "  Invoice 1:"
invoke "$INVOICE_REGISTRY_CONTRACT" \
  get_invoice \
  --invoice_id "$DOC_HASH_1" || echo "  ⚠️  Could not fetch invoice 1"

echo ""
echo "  Invoice 2:"
invoke "$INVOICE_REGISTRY_CONTRACT" \
  get_invoice \
  --invoice_id "$DOC_HASH_2" || echo "  ⚠️  Could not fetch invoice 2"

echo ""
echo "  Pool state:"
invoke "$LIQUIDITY_POOL_CONTRACT" \
  get_pool_state || echo "  ⚠️  Could not fetch pool state"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Seeding Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Seeded:"
echo "  - 3 sample invoices"
echo "  - 3 marketplace listings (2 FixedRate, 1 DutchAuction)"
echo "  - 1 pool deposit (100,000 USDC)"
echo ""
echo "  You can now explore via the API or frontend."
echo ""
