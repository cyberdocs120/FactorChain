# FactorChain 🔗💸
### Decentralized Invoice Factoring Marketplace on Soroban

<div align="center">

![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-7B2BFF?style=for-the-badge&logo=stellar&logoColor=white)
![Stellar](https://img.shields.io/badge/Stellar-Network-000000?style=for-the-badge&logo=stellar&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-Smart%20Contracts-CE422B?style=for-the-badge&logo=rust&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Typed-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)

**Unlocking liquidity for businesses. Earning yield for investors. Powered by Soroban smart contracts on Stellar.**

[Live Demo](https://factorchain.app) · [API Docs](https://api.factorchain.app/docs) · [Smart Contracts](./contracts) · [Report Bug](https://github.com/factorchain/issues) · [Request Feature](https://github.com/factorchain/discussions)

</div>

---

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [System Architecture](#-system-architecture)
- [Smart Contract Design](#-smart-contract-design)
- [Backend Services](#-backend-services)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Smart Contract Reference](#-smart-contract-reference)
- [REST API Reference](#-rest-api-reference)
- [Frontend Guide](#-frontend-guide)
- [Security Model](#-security-model)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔥 The Problem

Every year, **$3.1 trillion in unpaid invoices** paralyze businesses worldwide. Small and medium enterprises (SMEs) especially in emerging markets issue invoices to their buyers and then **wait 30, 60, even 90 days** for payment, while:

- Payroll comes due every two weeks
- Suppliers demand upfront cash
- Growth opportunities disappear while cash is frozen

Traditional invoice factoring exists to solve this — but it's **broken**:

| Pain Point | Reality |
|---|---|
| 🏦 Gatekeeping | Only bankable businesses qualify |
| 💸 Opaque pricing | Discount rates are negotiated in the dark |
| 🌍 Geographic limits | Cross-border factoring is rare and expensive |
| ⏳ Slow settlement | Days of manual verification before cash is released |
| 🔒 Counterparty risk | No guarantees; trust-based with little recourse |
| 📋 Double-financing fraud | Same invoice sold to multiple factors simultaneously |

---

## 💡 The Solution

**FactorChain** is a full-stack, on-chain invoice factoring marketplace built on **Soroban** — Stellar's smart contract platform. It pairs trustless smart contracts with a purpose-built off-chain backend that handles everything the blockchain cannot: document storage, search indexing, risk scoring, and real-time notifications.

```
Seller tokenizes invoice  →  Lists on marketplace  →  Investors bid
         ↑                                                   ↓
Smart contract enforces                        Seller receives immediate USDC
payment at maturity       ←  Buyer settles  ←  Funds held in escrow contract
```

**For sellers:** Convert your receivables into immediate liquidity without a bank.
**For investors:** Earn short-duration, real-yield returns backed by real-world invoices.
**For buyers:** Structured, auditable payment commitments with on-chain settlement.

---

## 🏗️ System Architecture

FactorChain is a three-layer system. Smart contracts handle all money and state. The backend handles everything off-chain. The frontend stitches both together.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           FACTORCHAIN SYSTEM                              │
├─────────────────────┬──────────────────────────┬────────────────────────┤
│   FRONTEND (React)  │   BACKEND (NestJS)        │  SOROBAN CONTRACTS     │
│                     │                           │                        │
│  ┌───────────────┐  │  ┌────────────────────┐  │  ┌──────────────────┐  │
│  │ Seller Portal │◀─┼─▶│   REST API         │  │  │ InvoiceRegistry  │  │
│  └───────────────┘  │  │   (NestJS)         │  │  └──────────────────┘  │
│                     │  └────────┬───────────┘  │           │            │
│  ┌───────────────┐  │           │               │  ┌──────────────────┐  │
│  │ Investor UI   │◀─┼───────────┤               │  │   Marketplace    │  │
│  └───────────────┘  │           │               │  └──────────────────┘  │
│          │          │  ┌────────▼───────────┐  │           │            │
│  Direct  │          │  │   Event Indexer    │◀─┼───────────┤            │
│  RPC     │          │  │   (Stellar events) │  │  ┌──────────────────┐  │
│          │          │  └────────┬───────────┘  │  │  EscrowContract  │  │
│  ┌───────▼───────┐  │           │               │  └──────────────────┘  │
│  │  Buyer Panel  │  │  ┌────────▼───────────┐  │           │            │
│  └───────────────┘  │  │   PostgreSQL DB     │  │  ┌──────────────────┐  │
│                     │  └────────────────────┘  │  │  LiquidityPool   │  │
│  ┌───────────────┐  │                           │  └──────────────────┘  │
│  │    Admin /    │  │  ┌────────────────────┐  │           │            │
│  │ Risk Dashboard│◀─┼─▶│  Oracle Service    │──┼──▶┌──────────────────┐  │
│  └───────────────┘  │  │  (risk scoring)    │  │  │ OracleContract   │  │
│                     │  └────────────────────┘  │  └──────────────────┘  │
│                     │                           │                        │
│                     │  ┌────────────────────┐  │                        │
│                     │  │  Document Service  │──┼──▶ IPFS (Pinata)       │
│                     │  │  (PDF → IPFS)      │  │                        │
│                     │  └────────────────────┘  │                        │
│                     │                           │                        │
│                     │  ┌────────────────────┐  │                        │
│                     │  │  Notification Svc  │  │                        │
│                     │  │  (Email / Webhook) │  │                        │
│                     │  └────────────────────┘  │                        │
└─────────────────────┴──────────────────────────┴────────────────────────┘
                                    │
                           ┌────────┴────────┐
                           │  Stellar Network │
                           │  (XLM / USDC)   │
                           └─────────────────┘
```

### Why Both Contracts AND a Backend?

| Responsibility | Handled By | Why |
|---|---|---|
| Fund custody & release | Smart contract | Trustless, non-custodial |
| Invoice lifecycle state | Smart contract | Immutable audit trail |
| Payment authorization | Smart contract | Wallet signature required |
| Invoice document storage | Backend → IPFS | Chain can't store files |
| Marketplace search & filtering | Backend (PostgreSQL) | Chain has no query layer |
| Risk scoring & oracle feeds | Backend → Oracle contract | Requires off-chain data |
| Email / webhook notifications | Backend | Chain can't call HTTP |
| KYB / compliance checks | Backend | Regulatory, off-chain |
| Event history & analytics | Backend (indexer) | Efficient historical queries |

---

## 📜 Smart Contract Design

FactorChain is composed of **5 core Soroban contracts**, each with a single, auditable responsibility:

### 1. `InvoiceRegistry` — The Source of Truth
Handles the tokenization and lifecycle of invoices. Each invoice is minted as a unique on-chain record with a cryptographic hash of its off-chain document for tamper-proof verification.

```rust
pub struct InvoiceState {
    pub seller: Address,
    pub buyer: Address,
    pub face_value: i128,       // in stroops (USDC)
    pub due_date: u64,          // Unix timestamp
    pub doc_hash: BytesN<32>,   // SHA-256 of invoice PDF
    pub status: InvoiceStatus,  // Draft | Listed | Funded | Settled | Defaulted
    pub created_at: u64,
}

pub enum InvoiceStatus {
    Draft,
    Listed,
    Funded,
    Settled,
    Defaulted,
}
```

**Double-financing guard:** Each `(seller, doc_hash)` pair is checked for uniqueness at mint time. Attempting to tokenize the same invoice twice results in a hard contract error.

---

### 2. `MarketplaceContract` — The Exchange Layer
Manages invoice listings, investor bids, and the auction/direct-sale mechanics. Supports two sale modes:

- **Dutch Auction** — Discount rate starts high and drops until a bid is placed
- **Fixed-Rate Listing** — Seller names a discount rate; first matching investor wins

```rust
pub struct Listing {
    pub invoice_id: BytesN<32>,
    pub mode: SaleMode,
    pub discount_rate_bps: u32,   // basis points, e.g. 250 = 2.5%
    pub min_fill_pct: u32,        // minimum % to accept (enables partial funding)
    pub deadline: u64,
    pub bids: Vec<Bid>,
}
```

---

### 3. `EscrowContract` — The Settlement Engine
When a bid is accepted, funds move immediately from the investor to a time-locked escrow. The escrow contract:
- Releases principal + discount to the investor when the buyer settles
- Enforces a **grace period** before triggering a default flag
- Handles **partial repayments** gracefully

---

### 4. `LiquidityPool` — The Capital Layer
Allows passive investors to deposit USDC into a shared pool that auto-funds invoices within pre-set risk parameters. Pool shares are represented as fungible tokens, enabling secondary market trading of pool positions.

```rust
pub struct PoolConfig {
    pub max_invoice_size: i128,
    pub min_discount_rate_bps: u32,
    pub max_tenor_days: u32,
    pub max_single_buyer_exposure_pct: u32,  // concentration limit
}
```

---

### 5. `OracleContract` — The Risk Layer
An on-chain risk oracle that aggregates scores submitted by authorized backend oracle operators to produce a **Buyer Risk Score** (0–100) used to price invoices and gate pool eligibility. The backend oracle service is the sole authorized submitter.

---

## ⚙️ Backend Services

The backend is a **NestJS monorepo** composed of four focused services, all sharing a single PostgreSQL database.

### Service 1 — REST API (`apps/api`)
The primary interface for the frontend. Handles authentication, invoice document upload, and serves indexed marketplace data that the chain cannot efficiently query.

**Responsibilities:**
- JWT authentication (signed with Stellar wallet — no passwords)
- Invoice PDF upload → virus scan → SHA-256 hash → IPFS pin → return CID + hash
- Marketplace search and filtering (tenor, rate, risk score, buyer country)
- Portfolio analytics aggregation for sellers and investors
- Webhook registration for third-party integrations

---

### Service 2 — Event Indexer (`apps/indexer`)
A long-running process that streams Soroban contract events from the Stellar RPC node and writes structured records into PostgreSQL. This is what makes marketplace search fast.

**Indexed events:**
```
InvoiceMinted       → invoices table
InvoiceListed       → listings table
BidPlaced           → bids table
BidAccepted         → escrows table
InvoiceSettled      → settlements table
InvoiceDefaulted    → defaults table
PoolDeposit         → pool_positions table
PoolWithdrawal      → pool_positions table
```

**Indexer guarantee:** All writes are idempotent. Re-processing the same event twice produces the same database state — safe to replay on restart.

---

### Service 3 — Oracle Service (`apps/oracle`)
A scheduled service that fetches buyer credit signals from external data providers and submits risk scores to the `OracleContract` on-chain.

**Data sources (configurable):**
- Business registration APIs
- Trade credit bureau feeds
- On-chain payment history (from the indexer's `settlements` table)
- Self-reported financial data (submitted via API)

**Scoring pipeline:**
```
Fetch signals → Normalize (0–100) → Weighted median → Submit to OracleContract
```

Runs on a **24-hour cron**, with an on-demand re-score endpoint for newly registered buyers.

---

### Service 4 — Notification Service (`apps/notifications`)
Listens to the indexer's event stream via an internal queue and dispatches notifications to users.

**Triggers:**
| Event | Notification Sent To |
|---|---|
| New bid on your listing | Seller (email + in-app) |
| Your bid was accepted | Investor (email + in-app) |
| Invoice due in 3 days | Buyer (email) |
| Invoice settled | Investor (email + in-app) |
| Invoice defaulted | Investor (email + in-app) |
| Pool auto-funded your invoice | Seller (in-app) |

Supports **email** (via Resend) and **webhooks** for B2B integrations.

---

## ✨ Core Features

### For Sellers 🏭
- **Guided invoice tokenization** — Upload PDF; backend hashes, pins to IPFS, and mints on-chain in one flow
- **Flexible funding modes** — Dutch auction, fixed-rate, or pool auto-funding
- **Partial funding support** — Get funded for 50%, 75%, or 100% of invoice face value
- **Real-time dashboard** — Track listed, funded, and settled invoices in a single view
- **Settlement reminders** — Automated buyer notifications via email 3 days before due date

### For Investors 💼
- **Searchable marketplace** — Filter by tenor, discount rate, buyer risk score, sector, and geography
- **Liquidity pool** — Deposit and earn yield passively; pool auto-allocates capital
- **Portfolio analytics** — Real-time IRR, weighted average tenor, and exposure breakdown
- **Pool shares tradeable** — Secondary liquidity on your pool position via SAC tokens
- **Bid notifications** — Instant alerts when bids are accepted or invoices settle

### For Buyers 🤝
- **Structured settlement** — On-chain payment schedule with smart contract enforcement
- **Reputation building** — On-chain settlement history builds a verifiable, portable credit trail
- **Multi-invoice netting** — Settle multiple invoices in a single transaction
- **Risk score transparency** — View your own buyer risk score and the signals behind it

### Platform-Wide 🌐
- **Full auditability** — Every state transition recorded on Stellar's immutable ledger
- **Cross-border native** — USDC-denominated; no FX risk, no correspondent banking fees
- **Non-custodial** — Funds always in smart contract escrow; platform never touches money
- **Multi-wallet support** — Freighter, Lobstr, Albedo, xBull
- **Webhook API** — B2B integrations with ERP systems (SAP, QuickBooks)

---

## 🛠️ Tech Stack

### Smart Contracts
| Technology | Purpose |
|---|---|
| **Rust** | Contract implementation language |
| **Soroban SDK** | Stellar smart contract framework |
| **soroban-cli** | Build, deploy, and invoke contracts |
| **cargo-llvm-cov** | Contract test coverage |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 20 + TypeScript** | Runtime and language |
| **NestJS** | Backend framework (monorepo) |
| **PostgreSQL 16** | Primary database |
| **Prisma** | ORM and schema migrations |
| **BullMQ + Redis** | Job queue (indexer → notifications) |
| **@stellar/stellar-sdk** | Soroban RPC client & event streaming |
| **Pinata SDK** | IPFS document storage |
| **Resend** | Transactional email |
| **Swagger / OpenAPI** | Auto-generated API documentation |
| **Passport + JWT** | Wallet-based authentication |
| **Zod** | Runtime input validation |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18 + TypeScript** | UI framework |
| **Vite** | Build tool |
| **Stellar Wallets Kit** | Multi-wallet connector |
| **@stellar/stellar-sdk** | Contract client bindings |
| **Zustand** | Client state management |
| **TanStack Query** | Server state, caching, background refetch |
| **Tailwind CSS + shadcn/ui** | Component library |
| **Recharts** | Portfolio analytics charts |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Local development environment |
| **GitHub Actions** | CI/CD pipelines |
| **Railway / Render** | Backend hosting |
| **Vercel** | Frontend hosting |
| **Upstash Redis** | Managed Redis for job queue |

---

## 📁 Project Structure

```
factorchain/
│
├── contracts/                          # Soroban smart contracts (Rust)
│   ├── invoice-registry/
│   │   ├── src/
│   │   │   ├── lib.rs                  # Contract entrypoint
│   │   │   ├── invoice.rs              # Invoice data types & state
│   │   │   ├── mint.rs                 # Tokenization logic
│   │   │   ├── validation.rs           # Hash & duplicate checks
│   │   │   └── events.rs               # Contract events
│   │   ├── Cargo.toml
│   │   └── tests/
│   ├── marketplace/
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── listing.rs
│   │   │   ├── bidding.rs
│   │   │   ├── matching.rs
│   │   │   └── events.rs
│   │   ├── Cargo.toml
│   │   └── tests/
│   ├── escrow/
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── escrow.rs
│   │   │   ├── settlement.rs
│   │   │   ├── default.rs
│   │   │   └── events.rs
│   │   ├── Cargo.toml
│   │   └── tests/
│   ├── liquidity-pool/
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── pool.rs
│   │   │   ├── allocation.rs
│   │   │   ├── shares.rs
│   │   │   └── events.rs
│   │   ├── Cargo.toml
│   │   └── tests/
│   ├── oracle/
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── score.rs
│   │   │   ├── operators.rs
│   │   │   └── events.rs
│   │   ├── Cargo.toml
│   │   └── tests/
│   └── shared/                         # Shared types & error codes
│       └── src/
│           ├── types.rs
│           ├── errors.rs
│           └── constants.rs
│
├── backend/                            # NestJS monorepo
│   ├── apps/
│   │   ├── api/                        # REST API service
│   │   │   ├── src/
│   │   │   │   ├── main.ts
│   │   │   │   ├── app.module.ts
│   │   │   │   ├── auth/               # Wallet-based JWT auth
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── stellar.strategy.ts
│   │   │   │   │   └── jwt.guard.ts
│   │   │   │   ├── invoices/           # Invoice CRUD & upload
│   │   │   │   │   ├── invoices.module.ts
│   │   │   │   │   ├── invoices.controller.ts
│   │   │   │   │   ├── invoices.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── marketplace/        # Search & listing queries
│   │   │   │   │   ├── marketplace.module.ts
│   │   │   │   │   ├── marketplace.controller.ts
│   │   │   │   │   ├── marketplace.service.ts
│   │   │   │   │   └── filters.dto.ts
│   │   │   │   ├── portfolio/          # Investor/seller analytics
│   │   │   │   │   ├── portfolio.module.ts
│   │   │   │   │   ├── portfolio.controller.ts
│   │   │   │   │   └── portfolio.service.ts
│   │   │   │   ├── buyers/             # Buyer profiles & risk scores
│   │   │   │   │   ├── buyers.module.ts
│   │   │   │   │   ├── buyers.controller.ts
│   │   │   │   │   └── buyers.service.ts
│   │   │   │   └── webhooks/           # Outbound webhook management
│   │   │   │       ├── webhooks.module.ts
│   │   │   │       ├── webhooks.controller.ts
│   │   │   │       └── webhooks.service.ts
│   │   │   └── test/
│   │   │
│   │   ├── indexer/                    # Soroban event indexer
│   │   │   └── src/
│   │   │       ├── main.ts
│   │   │       ├── indexer.module.ts
│   │   │       ├── stream.service.ts   # Stellar RPC event stream
│   │   │       ├── processor.service.ts # Event → DB writes
│   │   │       └── handlers/           # Per-event-type handlers
│   │   │           ├── invoice.handler.ts
│   │   │           ├── listing.handler.ts
│   │   │           ├── escrow.handler.ts
│   │   │           └── pool.handler.ts
│   │   │
│   │   ├── oracle/                     # Risk scoring oracle
│   │   │   └── src/
│   │   │       ├── main.ts
│   │   │       ├── oracle.module.ts
│   │   │       ├── scorer.service.ts   # Scoring pipeline
│   │   │       ├── submitter.service.ts # On-chain score submission
│   │   │       └── providers/          # External data source adapters
│   │   │           ├── credit-bureau.provider.ts
│   │   │           ├── onchain-history.provider.ts
│   │   │           └── self-reported.provider.ts
│   │   │
│   │   └── notifications/             # Notification dispatcher
│   │       └── src/
│   │           ├── main.ts
│   │           ├── notifications.module.ts
│   │           ├── listener.service.ts # Listens to BullMQ events
│   │           ├── email.service.ts    # Resend integration
│   │           └── webhook.service.ts  # Outbound webhook dispatch
│   │
│   ├── libs/
│   │   ├── prisma/                     # Prisma client & schema
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── soroban/                    # Shared Soroban client
│   │   │   ├── soroban.module.ts
│   │   │   └── soroban.service.ts
│   │   └── common/                     # Shared DTOs, guards, pipes
│   │
│   ├── docker-compose.yml              # Local Postgres + Redis
│   ├── nest-cli.json
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                           # React + TypeScript frontend
│   ├── src/
│   │   ├── features/
│   │   │   ├── seller/
│   │   │   ├── investor/
│   │   │   ├── buyer/
│   │   │   └── admin/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── invoice/
│   │   │   ├── wallet/
│   │   │   └── charts/
│   │   ├── hooks/
│   │   │   ├── useContract.ts          # Direct Soroban RPC calls
│   │   │   ├── useApi.ts               # Backend REST API calls
│   │   │   ├── useWallet.ts
│   │   │   └── useInvoice.ts
│   │   ├── lib/
│   │   │   ├── soroban.ts
│   │   │   ├── api.ts                  # Axios client (→ backend)
│   │   │   └── utils.ts
│   │   └── store/
│   ├── package.json
│   └── tsconfig.json
│
├── scripts/
│   ├── deploy.sh                       # Contract deployment
│   ├── initialize.sh                   # Post-deploy setup
│   └── seed-testnet.sh                 # Testnet data seeding
│
├── .github/
│   └── workflows/
│       ├── test-contracts.yml
│       ├── test-backend.yml
│       ├── test-frontend.yml
│       └── deploy.yml
│
├── .env.example                        # ← copy this to .env
├── Cargo.toml                          # Rust workspace manifest
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

```bash
# Rust (latest stable) + WASM target
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Soroban CLI
cargo install --locked soroban-cli --features opt

# Node.js 20+
node --version   # >= 20.0.0

# Docker (for local Postgres + Redis)
docker --version

# Generate a funded testnet keypair
soroban keys generate --global factorchain-dev --network testnet
```

---

### 1. Clone & Configure

```bash
git clone https://github.com/factorchain/factorchain.git
cd factorchain

# Copy environment template
cp .env.example .env
# → Edit .env with your keys (see Environment Variables section)
```

---

### 2. Start Infrastructure (Postgres + Redis)

```bash
cd backend
docker compose up -d

# Run database migrations
npx prisma migrate dev
```

---

### 3. Build & Deploy Contracts

```bash
# Build all contracts
cargo build --target wasm32-unknown-unknown --release

# Deploy to testnet (writes addresses to .env automatically)
chmod +x scripts/deploy.sh
./scripts/deploy.sh --network testnet --account factorchain-dev
```

---

### 4. Start Backend Services

```bash
cd backend

npm install

# Start all services in development mode
npm run start:dev          # API on :3000
npm run start:dev indexer  # Indexer (background process)
npm run start:dev oracle   # Oracle (cron + on-demand)
npm run start:dev notifications  # Notification dispatcher

# Or start everything at once
npm run start:all:dev
```

API docs available at: [http://localhost:3000/docs](http://localhost:3000/docs) (Swagger UI)

---

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

Connect **Freighter** wallet (set to Testnet) and you're live.

---

## 📘 Smart Contract Reference

### InvoiceRegistry

| Function | Parameters | Description |
|---|---|---|
| `mint_invoice` | `seller, buyer, face_value, due_date, doc_hash` | Tokenize a new invoice |
| `get_invoice` | `invoice_id` | Fetch invoice state |
| `update_status` | `invoice_id, new_status` | Update lifecycle status (authorized callers only) |
| `verify_document` | `invoice_id, doc_hash` | Verify document hash matches on-chain record |
| `list_by_seller` | `seller, page, page_size` | Paginated seller invoice history |
| `list_by_buyer` | `buyer, page, page_size` | Paginated buyer invoice history |

### MarketplaceContract

| Function | Parameters | Description |
|---|---|---|
| `create_listing` | `invoice_id, mode, discount_rate_bps, min_fill_pct, deadline` | List an invoice for funding |
| `place_bid` | `listing_id, amount, rate_bps` | Submit a funding bid |
| `accept_bid` | `listing_id, bid_id` | Accept bid; triggers escrow creation |
| `cancel_listing` | `listing_id` | Cancel an unfunded listing |
| `get_listing` | `listing_id` | Fetch listing details and bids |

### EscrowContract

| Function | Parameters | Description |
|---|---|---|
| `create_escrow` | `invoice_id, investor, seller, amount, due_date` | Lock investor funds |
| `settle` | `escrow_id` | Buyer repays; releases funds to investor |
| `partial_settle` | `escrow_id, amount` | Partial repayment |
| `trigger_default` | `escrow_id` | Mark defaulted after grace period |
| `get_escrow` | `escrow_id` | Fetch escrow state |

### LiquidityPool

| Function | Parameters | Description |
|---|---|---|
| `deposit` | `amount` | Add USDC; receive pool share tokens |
| `withdraw` | `share_amount` | Burn shares; receive proportional USDC |
| `auto_fund` | `invoice_id` | Pool-fund an eligible invoice |
| `get_pool_state` | — | Total deposits, deployed capital, pending returns |
| `get_position` | `investor` | Individual share balance and estimated value |

---

## 🌐 REST API Reference

Base URL: `https://api.factorchain.app/v1`
Full interactive docs: `/docs` (Swagger UI)

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

JWT tokens are obtained by signing a server-issued challenge with your Stellar wallet.

---

### Authentication

#### `POST /auth/challenge`
Request a sign challenge for a given Stellar address.

**Request:**
```json
{ "address": "GABC...XYZ" }
```
**Response:**
```json
{ "challenge": "factorchain:auth:1718000000:abc123" }
```

---

#### `POST /auth/verify`
Submit signed challenge to receive a JWT.

**Request:**
```json
{
  "address": "GABC...XYZ",
  "challenge": "factorchain:auth:1718000000:abc123",
  "signature": "base64_signature_of_challenge"
}
```
**Response:**
```json
{ "access_token": "eyJ...", "expires_in": 86400 }
```

---

### Invoices

#### `POST /invoices/upload` 🔒
Upload an invoice PDF. Returns the IPFS CID and SHA-256 hash to use when minting on-chain.

**Request:** `multipart/form-data` with field `file` (PDF, max 10MB)

**Response:**
```json
{
  "cid": "bafybei...",
  "doc_hash": "a3f8c2...",
  "ipfs_url": "https://ipfs.io/ipfs/bafybei..."
}
```

---

#### `GET /invoices/:invoice_id`
Fetch enriched invoice data (on-chain state + off-chain metadata).

**Response:**
```json
{
  "invoice_id": "abc123...",
  "seller": "GABC...XYZ",
  "buyer": "GDEF...UVW",
  "face_value": "50000.00",
  "currency": "USDC",
  "due_date": "2025-09-01T00:00:00Z",
  "status": "Listed",
  "doc_hash": "a3f8c2...",
  "ipfs_url": "https://ipfs.io/ipfs/bafybei...",
  "buyer_risk_score": 72,
  "created_at": "2025-07-01T10:00:00Z"
}
```

---

### Marketplace

#### `GET /marketplace/listings`
Search and filter active invoice listings.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `min_rate_bps` | number | Minimum discount rate (basis points) |
| `max_rate_bps` | number | Maximum discount rate |
| `max_tenor_days` | number | Maximum days until due date |
| `min_risk_score` | number | Minimum buyer risk score (0–100) |
| `max_face_value` | number | Maximum invoice face value (USDC) |
| `page` | number | Page number (default: 1) |
| `page_size` | number | Results per page (default: 20, max: 100) |

**Response:**
```json
{
  "data": [
    {
      "listing_id": "lst_abc...",
      "invoice_id": "inv_xyz...",
      "face_value": "50000.00",
      "discount_rate_bps": 250,
      "tenor_days": 45,
      "buyer_risk_score": 72,
      "mode": "FixedRate",
      "funded_pct": 0,
      "deadline": "2025-07-10T00:00:00Z"
    }
  ],
  "total": 142,
  "page": 1,
  "page_size": 20
}
```

---

### Portfolio

#### `GET /portfolio/seller` 🔒
Seller portfolio: all invoices with funding and settlement status.

#### `GET /portfolio/investor` 🔒
Investor portfolio: active positions, settled returns, IRR.

**Response (investor):**
```json
{
  "total_deployed": "250000.00",
  "total_returned": "182500.00",
  "pending_return": "68750.00",
  "realized_irr_pct": 14.2,
  "positions": [
    {
      "escrow_id": "esc_abc...",
      "invoice_id": "inv_xyz...",
      "funded_amount": "25000.00",
      "expected_return": "25625.00",
      "due_date": "2025-09-01T00:00:00Z",
      "status": "Active"
    }
  ]
}
```

---

### Buyers

#### `GET /buyers/:address/risk-score`
Fetch the current on-chain risk score and contributing signals for a buyer address.

**Response:**
```json
{
  "address": "GDEF...UVW",
  "risk_score": 72,
  "score_date": "2025-07-01T00:00:00Z",
  "signals": {
    "on_chain_settlement_rate": 0.96,
    "average_days_to_settle": 38,
    "total_invoices_settled": 14,
    "credit_bureau_score": 68
  }
}
```

---

### Webhooks

#### `POST /webhooks` 🔒
Register a webhook URL to receive real-time event notifications.

**Request:**
```json
{
  "url": "https://your-erp.com/factorchain-events",
  "events": ["invoice.settled", "invoice.defaulted", "bid.accepted"],
  "secret": "your_webhook_secret"
}
```

**Webhook payload (example):**
```json
{
  "event": "invoice.settled",
  "timestamp": "2025-09-01T14:22:00Z",
  "data": {
    "invoice_id": "inv_xyz...",
    "escrow_id": "esc_abc...",
    "settled_amount": "50000.00",
    "tx_hash": "abc123..."
  }
}
```
Payloads are signed with `HMAC-SHA256` using your webhook secret. Verify the `X-FactorChain-Signature` header on receipt.

---

## 🖥️ Frontend Guide

### Seller Flow

```
1. Connect wallet (Freighter / Lobstr / Albedo)
2. Seller Portal → New Invoice
3. Upload PDF → backend hashes + pins to IPFS → returns doc_hash
4. Fill details: buyer wallet, face value, due date
5. Sign & submit → InvoiceRegistry.mint_invoice() with doc_hash
6. Choose listing mode: Fixed Rate or Dutch Auction
7. Submit listing → MarketplaceContract.create_listing()
8. Monitor bids in real-time (indexed by backend, served via REST)
9. Accept a bid → EscrowContract.create_escrow() triggered
10. USDC arrives in seller wallet immediately (minus discount)
```

### Investor Flow

```
1. Connect wallet
2. Marketplace → filter by tenor, rate, risk score
3. Click invoice → view details + buyer risk score from API
4. Place bid or direct fund (on-chain transaction)
5. Funds locked in EscrowContract
6. Monitor portfolio via /portfolio/investor endpoint
7. Receive notification when invoice settles or defaults
```

### Buyer Flow

```
1. Connect wallet (must match buyer address on invoice)
2. Pending Settlements dashboard (served by backend indexer)
3. Click invoice → see face value due + due date
4. Settle → USDC transferred to EscrowContract
5. EscrowContract releases funds to investor
6. Invoice status updated on-chain; indexer syncs to DB
```

---

## 🛡️ Security Model

### On-Chain Protections

| Threat | Mitigation |
|---|---|
| **Double-financing fraud** | `(seller, doc_hash)` uniqueness enforced at mint time |
| **Unauthorized status updates** | Role-based access; only authorized contract addresses can call `update_status` |
| **Front-running bids** | Commitment-reveal scheme for Dutch auction bids |
| **Reentrancy** | Soroban's execution model prevents cross-contract reentrancy by design |
| **Oracle manipulation** | Multi-signal median aggregation; outlier rejection; operator whitelist |
| **Escrow theft** | Funds only releasable to pre-set addresses; no admin withdrawal function |
| **Integer overflow** | All arithmetic uses Soroban's checked arithmetic primitives |

### Off-Chain / Backend Protections

| Threat | Mitigation |
|---|---|
| **Document tampering** | SHA-256 hash stored on-chain; backend verifies before serving |
| **API auth bypass** | Wallet-signed challenge; no passwords, no sessions |
| **Forged webhook events** | HMAC-SHA256 payload signing with per-endpoint secrets |
| **Oracle data manipulation** | Multi-provider aggregation; scores anchored to on-chain settlement history |
| **SQL injection** | Prisma ORM parameterized queries throughout |
| **Rate abuse** | Per-IP and per-wallet rate limiting on all API endpoints |
| **Indexer replay attacks** | Idempotent event writes keyed on `(contract_address, ledger_sequence, event_index)` |

### Audit Status

> ⚠️ **FactorChain smart contracts are unaudited. Do not use with real funds until a formal security audit has been completed.**
>
> Audit engagement is planned for Q4 2025 before any mainnet deployment.

---

## 🧪 Testing

### Contract Tests

```bash
# Run all contract unit tests
cargo test

# Run with output
cargo test -- --nocapture

# Run a specific test
cargo test test_double_financing_rejected -- --nocapture

# Run cross-contract integration tests
cargo test --test integration -- --nocapture

# Generate coverage report
cargo install cargo-llvm-cov
cargo llvm-cov --all-features --workspace --html
```

Key test scenarios:
- Full invoice lifecycle: mint → list → bid → accept → settle
- Dutch auction price decay and bid acceptance
- Pool auto-funding with risk filter gating
- Default workflow: escrow creation → grace period → default flag
- Partial funding and partial settlement flows

---

### Backend Tests

```bash
cd backend

# Unit tests
npm run test

# Integration tests (requires Docker services running)
npm run test:e2e

# Coverage report
npm run test:cov
```

Key backend test scenarios:
- Invoice upload: PDF hashing, IPFS pinning, duplicate detection
- Marketplace search: filter combinations, pagination, sorting
- Indexer: idempotent event processing, replay safety
- Oracle: scoring pipeline, on-chain submission, signal weighting
- Auth: challenge generation, signature verification, JWT expiry

---

### Frontend Tests

```bash
cd frontend
npm test             # Vitest unit tests
npm run test:e2e     # Playwright end-to-end tests
```

---

## 🚢 Deployment

### Local Development

```bash
# Start all infrastructure
cd backend && docker compose up -d

# Start all backend services
npm run start:all:dev

# Start frontend
cd ../frontend && npm run dev
```

---

### Testnet

```bash
# Deploy contracts
./scripts/deploy.sh --network testnet --account factorchain-dev

# Deploy backend (Railway)
railway up --service api
railway up --service indexer
railway up --service oracle
railway up --service notifications

# Deploy frontend (Vercel)
cd frontend && vercel --prod
```

---

### Mainnet

> ⚠️ Mainnet deployment requires a completed security audit and a 3-of-5 multisig approval.

```bash
./scripts/deploy.sh --network mainnet --account factorchain-mainnet
```

Contract upgrades are controlled by the **admin multisig** (3-of-5 key threshold). No single key can upgrade any contract unilaterally.

### Deployed Contract Addresses

> Testnet addresses will be published here upon first testnet deployment. Mainnet deployment is pending audit completion.

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and fill in all values before running any service.

```bash
# ─── Stellar / Soroban ────────────────────────────────────────
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
ORACLE_OPERATOR_SECRET=S...          # Stellar secret key for oracle submissions

# ─── Contract Addresses (populated by deploy.sh) ──────────────
INVOICE_REGISTRY_CONTRACT=C...
MARKETPLACE_CONTRACT=C...
ESCROW_CONTRACT=C...
LIQUIDITY_POOL_CONTRACT=C...
ORACLE_CONTRACT=C...

# ─── Database ─────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/factorchain

# ─── Redis ────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── IPFS / Pinata ────────────────────────────────────────────
PINATA_API_KEY=...
PINATA_SECRET=...

# ─── Auth ─────────────────────────────────────────────────────
JWT_SECRET=...                       # Minimum 32 random characters
JWT_EXPIRES_IN=86400                 # Seconds (24h)

# ─── Email ────────────────────────────────────────────────────
RESEND_API_KEY=re_...
EMAIL_FROM=notifications@factorchain.app

# ─── Frontend (Vite) ──────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_INVOICE_REGISTRY_CONTRACT=C...
VITE_MARKETPLACE_CONTRACT=C...
VITE_ESCROW_CONTRACT=C...
VITE_LIQUIDITY_POOL_CONTRACT=C...
```

---

## 🗺️ Roadmap

### Phase 1 — Foundation ✅ *(Complete)*
- [x] Invoice tokenization (InvoiceRegistry contract)
- [x] Fixed-rate marketplace listings
- [x] Single-investor escrow and settlement
- [x] Backend API + event indexer
- [x] Basic seller and investor frontend portals
- [x] Testnet deployment

### Phase 2 — Market Depth 🔄 *(In Progress)*
- [ ] Dutch auction mechanism
- [ ] Partial funding (multiple investors per invoice)
- [ ] Liquidity pool contract + passive yield
- [ ] Buyer settlement portal
- [ ] Oracle service v1 (on-chain risk scoring)
- [ ] Email notification service

### Phase 3 — Scale 📅 *(Q3 2026)*
- [ ] Pool share token secondary market
- [ ] Multi-currency support (EURC, BRLA)
- [ ] Advanced oracle with ML-assisted scoring
- [ ] Webhook API for ERP integrations
- [ ] Mobile app (React Native)

### Phase 4 — Ecosystem 📅 *(Q4 2026)*
- [ ] Security audit completion
- [ ] DAO governance for pool risk parameters
- [ ] Cross-chain bridge (Ethereum USDC → Stellar)
- [ ] Insurance layer for default protection
- [ ] **Mainnet launch**

---

## 🤝 Contributing

FactorChain is built in the open. We welcome Rust developers, TypeScript engineers, security researchers, and domain experts in trade finance.

### How to Contribute

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feat/your-feature-name`
3. **Write tests** — required for all PRs touching `contracts/` or `backend/`
4. **Run the full test suite**: `cargo test && cd backend && npm test`
5. **Submit a PR** — describe what changed and why, and link any related issues

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines including commit message format, PR review process, and code style.

### Areas Where Help is Needed

- 🦀 **Rust / Soroban** — Contract features, gas optimization, security review
- 🔒 **Security** — Audit contracts and backend; open issues for any findings
- ⚙️ **Backend** — Oracle data providers, indexer performance, additional API endpoints
- 🎨 **Frontend** — UX improvements, mobile responsiveness, accessibility
- 📖 **Documentation** — User guides, integration tutorials, video walkthroughs
- 🌍 **Translations** — Priority: Portuguese, French, Swahili

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- [Stellar Development Foundation](https://stellar.org) — for Soroban and the Stellar ecosystem
- [Circle](https://circle.com) — for USDC on Stellar
- [Pinata](https://pinata.cloud) — for IPFS infrastructure
- [NestJS](https://nestjs.com) — for the backend framework
- The global factoring community for decades of financial infrastructure that FactorChain builds upon

---

<div align="center">

**Built with ❤️ on Soroban · Stellar Network**

[Website](https://factorchain.app) · [API Docs](https://api.factorchain.app/docs) · [Twitter/X](https://twitter.com/factorchain) · [Discord](https://discord.gg/factorchain) · [Telegram](https://t.me/factorchain)

</div>
