#!/usr/bin/env bash
set -euo pipefail

# ─── FactorChain Contract Deployer ───────────────────────────────────────────
# Usage: ./scripts/deploy.sh --network testnet --account factorchain-dev
#
# Deploys all 5 FactorChain contracts to the specified Soroban network and
# writes the deployed contract addresses to the .env file.
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
  echo "Error: --network is required (testnet or mainnet)"
  exit 1
fi

if [[ -z "$ACCOUNT" ]]; then
  echo "Error: --account is required (Stellar account name)"
  exit 1
fi

echo "🚀 Deploying FactorChain contracts to ${NETWORK} using account ${ACCOUNT}"

# ─── Build contracts ──────────────────────────────────────────────────────────
echo ""
echo "📦 Building contracts..."
cd "$PROJECT_ROOT"
cargo build --target wasm32-unknown-unknown --release

# ─── Deploy function ──────────────────────────────────────────────────────────
deploy_contract() {
  local contract_path="$1"
  local contract_name="$2"
  local wasm_file="target/wasm32-unknown-unknown/release/${contract_name}.wasm"

  if [[ ! -f "$wasm_file" ]]; then
    echo "⚠️  WASM file not found: ${wasm_file}. Trying alternative path..."
    wasm_file="target/wasm32-unknown-unknown/release/${contract_name//-/_}.wasm"
  fi

  echo ""
  echo "  Deploying ${contract_name}..."

  local address
  address=$(soroban contract deploy \
    --wasm "$wasm_file" \
    --source "$ACCOUNT" \
    --network "$NETWORK" 2>&1 | tail -1)

  echo "  ✅ ${contract_name}: ${address}"
  echo "$address"
}

# ─── Deploy all 5 contracts ──────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deploying Contracts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INVOICE_REGISTRY_ADDR=$(deploy_contract "contracts/invoice-registry" "invoice_registry")
MARKETPLACE_ADDR=$(deploy_contract "contracts/marketplace" "marketplace")
ESCROW_ADDR=$(deploy_contract "contracts/escrow" "escrow")
LIQUIDITY_POOL_ADDR=$(deploy_contract "contracts/liquidity-pool" "liquidity_pool")
ORACLE_ADDR=$(deploy_contract "contracts/oracle" "oracle")

# ─── Initialize contracts ─────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Initializing Contracts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "  Initializing InvoiceRegistry..."
soroban contract invoke \
  --id "$INVOICE_REGISTRY_ADDR" \
  --source "$ACCOUNT" \
  --network "$NETWORK" \
  -- \
  __constructor \
  --admin "$(soroban keys address "$ACCOUNT")"

echo ""
echo "  Initializing OracleContract..."
soroban contract invoke \
  --id "$ORACLE_ADDR" \
  --source "$ACCOUNT" \
  --network "$NETWORK" \
  -- \
  __constructor \
  --admin "$(soroban keys address "$ACCOUNT")" \
  --operator "$(soroban keys address "$ACCOUNT")"

echo ""
echo "  Initializing LiquidityPool..."
soroban contract invoke \
  --id "$LIQUIDITY_POOL_ADDR" \
  --source "$ACCOUNT" \
  --network "$NETWORK" \
  -- \
  __constructor \
  --admin "$(soroban keys address "$ACCOUNT")" \
  --config "{ \"max_invoice_size\": 1000000000000, \"min_discount_rate_bps\": 100, \"max_tenor_days\": 90, \"max_single_buyer_exposure_pct\": 2000 }"

# ─── Write to .env ────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Writing Contract Addresses to .env"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENV_FILE="$PROJECT_ROOT/.env"

if [[ -f "$ENV_FILE" ]]; then
  # Update existing values
  sed -i "s|^INVOICE_REGISTRY_CONTRACT=.*|INVOICE_REGISTRY_CONTRACT=${INVOICE_REGISTRY_ADDR}|" "$ENV_FILE" 2>/dev/null || true
  sed -i "s|^MARKETPLACE_CONTRACT=.*|MARKETPLACE_CONTRACT=${MARKETPLACE_ADDR}|" "$ENV_FILE" 2>/dev/null || true
  sed -i "s|^ESCROW_CONTRACT=.*|ESCROW_CONTRACT=${ESCROW_ADDR}|" "$ENV_FILE" 2>/dev/null || true
  sed -i "s|^LIQUIDITY_POOL_CONTRACT=.*|LIQUIDITY_POOL_CONTRACT=${LIQUIDITY_POOL_ADDR}|" "$ENV_FILE" 2>/dev/null || true
  sed -i "s|^ORACLE_CONTRACT=.*|ORACLE_CONTRACT=${ORACLE_ADDR}|" "$ENV_FILE" 2>/dev/null || true
fi

# Always append to ensure they're present
if ! grep -q "^INVOICE_REGISTRY_CONTRACT=" "$ENV_FILE" 2>/dev/null; then
  echo "INVOICE_REGISTRY_CONTRACT=${INVOICE_REGISTRY_ADDR}" >> "$ENV_FILE"
fi
if ! grep -q "^MARKETPLACE_CONTRACT=" "$ENV_FILE" 2>/dev/null; then
  echo "MARKETPLACE_CONTRACT=${MARKETPLACE_ADDR}" >> "$ENV_FILE"
fi
if ! grep -q "^ESCROW_CONTRACT=" "$ENV_FILE" 2>/dev/null; then
  echo "ESCROW_CONTRACT=${ESCROW_ADDR}" >> "$ENV_FILE"
fi
if ! grep -q "^LIQUIDITY_POOL_CONTRACT=" "$ENV_FILE" 2>/dev/null; then
  echo "LIQUIDITY_POOL_CONTRACT=${LIQUIDITY_POOL_ADDR}" >> "$ENV_FILE"
fi
if ! grep -q "^ORACLE_CONTRACT=" "$ENV_FILE" 2>/dev/null; then
  echo "ORACLE_CONTRACT=${ORACLE_ADDR}" >> "$ENV_FILE"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Network:              ${NETWORK}"
echo "  Account:              ${ACCOUNT}"
echo "  InvoiceRegistry:      ${INVOICE_REGISTRY_ADDR}"
echo "  Marketplace:          ${MARKETPLACE_ADDR}"
echo "  Escrow:               ${ESCROW_ADDR}"
echo "  LiquidityPool:        ${LIQUIDITY_POOL_ADDR}"
echo "  Oracle:               ${ORACLE_ADDR}"
echo ""
echo "  Addresses written to: ${ENV_FILE}"
echo ""
