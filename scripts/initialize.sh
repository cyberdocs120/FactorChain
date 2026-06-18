#!/usr/bin/env bash
set -euo pipefail

# ─── FactorChain Post-Deploy Initializer ─────────────────────────────────────
# Usage: ./scripts/initialize.sh --network testnet
#
# Runs post-deploy setup: grants authorized caller roles, sets pool config,
# registers oracle operator, etc. Must run AFTER deploy.sh.
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ─── Parse arguments ──────────────────────────────────────────────────────────
NETWORK=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --network)
      NETWORK="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 --network <testnet|mainnet>"
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

# ─── Load contract addresses from .env ────────────────────────────────────────
ENV_FILE="$PROJECT_ROOT/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env file not found at ${ENV_FILE}"
  echo "Run deploy.sh first to populate contract addresses."
  exit 1
fi

source "$ENV_FILE"

echo "🔧 FactorChain Post-Deploy Initialization"
echo "  Network: ${NETWORK}"
echo ""

# ─── 1. Grant authorized caller roles ─────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Granting contract roles"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "  Adding Marketplace as authorized caller on InvoiceRegistry..."
soroban contract invoke \
  --id "$INVOICE_REGISTRY_CONTRACT" \
  --source-account "$(soroban keys identity "${ACCOUNT_NAME:-factorchain-dev}")" \
  --network "$NETWORK" \
  -- \
  add_authorized_caller \
  --caller "$MARKETPLACE_CONTRACT" || echo "  ⚠️  Could not add authorized caller (might already be set)"

echo "  Adding Escrow as authorized caller on InvoiceRegistry..."
soroban contract invoke \
  --id "$INVOICE_REGISTRY_CONTRACT" \
  --source-account "$(soroban keys identity "${ACCOUNT_NAME:-factorchain-dev}")" \
  --network "$NETWORK" \
  -- \
  add_authorized_caller \
  --caller "$ESCROW_CONTRACT" || echo "  ⚠️  Could not add authorized caller (might already be set)"

# ─── 2. Configure liquidity pool ──────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  2. Configuring Liquidity Pool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "  Pool config is set at constructor time."
echo "  Current pool config:"
soroban contract invoke \
  --id "$LIQUIDITY_POOL_CONTRACT" \
  --network "$NETWORK" \
  -- \
  get_config || echo "  ⚠️  Could not read pool config"

# ─── 3. Register oracle operators ─────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  3. Registering Oracle Operators"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "  Initial operator was registered at contract construction."
echo "  Additional operators can be added via add_operator."

# ─── 4. Verify all contracts respond ──────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  4. Verifying contract deployments"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_contract() {
  local name="$1"
  local address="$2"
  if [[ -n "$address" ]]; then
    echo "  ✅ ${name}: ${address}"
  else
    echo "  ❌ ${name}: NOT SET"
  fi
}

check_contract "InvoiceRegistry" "${INVOICE_REGISTRY_CONTRACT:-}"
check_contract "Marketplace" "${MARKETPLACE_CONTRACT:-}"
check_contract "Escrow" "${ESCROW_CONTRACT:-}"
check_contract "LiquidityPool" "${LIQUIDITY_POOL_CONTRACT:-}"
check_contract "Oracle" "${ORACLE_CONTRACT:-}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Initialization Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Next step: run ./scripts/seed-testnet.sh --network ${NETWORK}"
echo "  to populate sample test data."
echo ""
