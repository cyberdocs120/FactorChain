# Development Guide

## Overview

FactorChain is a full-stack decentralized invoice factoring marketplace. This guide covers how to set up, run, and debug all components locally.

## Prerequisites

```bash
# Rust (latest stable) + WASM target
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Soroban CLI
cargo install --locked soroban-cli --features opt

# Node.js 20+
node --version   # >= 20.0.0

# pnpm or npm
npm --version    # >= 10.0.0

# Docker + Docker Compose
docker --version
docker compose version
```

## Project Structure

```
factorchain/
├── contracts/          # Soroban smart contracts (Rust)
├── backend/            # NestJS monorepo (TypeScript)
│   ├── apps/
│   │   ├── api/        # REST API
│   │   ├── indexer/    # Event indexer
│   │   ├── oracle/     # Risk oracle
│   │   └── notifications/  # Notification dispatcher
│   └── libs/
│       ├── prisma/     # Database client
│       ├── soroban/    # Contract client
│       └── common/     # Shared utilities
├── frontend/           # React + Vite (TypeScript)
└── scripts/            # Deployment & seed scripts
```

## Quick Start

### 1. Environment Setup

```bash
cp .env.example .env
# Edit .env with your keys
```

### 2. Start Infrastructure

```bash
cd backend
docker compose up -d
# PostgreSQL on :5432, Redis on :6379

# Run database migrations
npx prisma migrate dev
```

### 3. Build & Test Contracts

```bash
# Build all contracts
cargo build --target wasm32-unknown-unknown --release

# Run contract tests
cargo test -- --nocapture
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
npx prisma generate
```

### 5. Start Backend Services

```bash
# Start all services concurrently
cd backend
npm run start:all:dev

# Or start individually:
npm run start:dev api              # REST API on :3000
npm run start:dev indexer          # Event indexer on :3001
npm run start:dev oracle           # Oracle on :3002
npm run start:dev notifications    # Notifications on :3003
```

### 6. Start Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

### 7. Deploy Contracts (Testnet)

```bash
# Generate a funded testnet keypair
soroban keys generate --global factorchain-dev --network testnet

# Deploy all contracts
./scripts/deploy.sh --network testnet --account factorchain-dev

# Initialize contract roles
./scripts/initialize.sh --network testnet

# Seed test data
./scripts/seed-testnet.sh --network testnet --account factorchain-dev
```

## Running Specific Services

### REST API Only

```bash
cd backend
npm run start:dev api
```

API docs available at http://localhost:3000/docs (Swagger UI)

### Indexer Only

```bash
cd backend
npm run start:dev indexer
```

The indexer polls Soroban RPC every 10 seconds for new events. Configure via `STREAM_POLL_INTERVAL_MS` environment variable.

### Oracle Only

```bash
cd backend
npm run start:dev oracle
```

Runs a daily scoring cron at midnight. Trigger on-demand rescoring:

```bash
curl -X POST http://localhost:3002/oracle/rescore/GABC...XYZ
```

### Notifications Only

```bash
cd backend
npm run start:dev notifications
```

Listens to BullMQ queue for events. Requires Redis running.

## Database Management

### Running Migrations

```bash
cd backend
npx prisma migrate dev --name describe_changes
```

### Seeding Test Data

```bash
cd backend
npx ts-node libs/prisma/src/seed.ts
```

### View Database

```bash
cd backend
npx prisma studio
# Opens browser at http://localhost:5555
```

## Testing

### Contract Tests

```bash
# All contract tests
cargo test -- --nocapture

# Single contract
cargo test -p invoice-registry -- --nocapture

# Specific test
cargo test test_double_financing_rejected -- --nocapture

# Cross-contract integration tests
cargo test -p marketplace --test integration_test -- --nocapture
```

### Backend Tests

```bash
cd backend

# Unit tests
npm test

# Integration tests (requires Docker services)
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend Tests

```bash
cd frontend
npm test              # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

## Common Commands Reference

| Command | Description |
|---------|-------------|
| `cargo test` | Run all contract tests |
| `cargo build --target wasm32-unknown-unknown --release` | Build WASM contracts |
| `npm run start:all:dev` | Start all backend services |
| `npm run start:dev api` | Start REST API only |
| `npm run dev` | Start frontend dev server |
| `npx prisma migrate dev` | Run DB migrations |
| `npx prisma studio` | Open DB browser |
| `npx prisma generate` | Generate Prisma client |
| `docker compose up -d` | Start Postgres + Redis |
| `./scripts/deploy.sh` | Deploy contracts |
| `./scripts/seed-testnet.sh` | Seed test data |

## Debugging Tips

### Backend

- Backend logs are colored by service (blue=API, green=Indexer, yellow=Oracle, magenta=Notifications)
- Set `NODE_ENV=development` for verbose logging
- Swagger UI at `http://localhost:3000/docs` — test all endpoints interactively
- Use `curl` to test API endpoints directly
- Check `.env` file for configuration errors if a service fails to start

### Contracts

- Use `cargo test -- --nocapture` to see `panic!` messages
- Add `env.events().publish()` calls to debug state transitions
- Use `soroban lab token wrap` to get test USDC on testnet
- Check Soroban RPC status: `curl <SOROBAN_RPC_URL>/health`

### Frontend

- Open browser DevTools → Network tab to inspect API calls
- React DevTools for component state inspection
- Zustand DevTools for store state inspection
- Check `.env` has correct `VITE_*` values if API calls fail

### Docker

```bash
# View service logs
docker compose logs -f postgres
docker compose logs -f redis

# Reset database
docker compose down -v && docker compose up -d

# Rebuild and start
docker compose up --build -d
```

## Troubleshooting

**Issue:** Contract deployment fails with "HTTP status 504"
- **Fix:** RPC node might be rate-limited. Wait a few seconds and retry.

**Issue:** Prisma migration fails
- **Fix:** Ensure PostgreSQL is running: `docker compose ps`
- **Fix:** Check DATABASE_URL in `.env`

**Issue:** Frontend shows blank page
- **Fix:** Run `npm run build` and check for TypeScript errors
- **Fix:** Check browser console for CORS errors

**Issue:** Indexer not picking up events
- **Fix:** Verify Soroban RPC URL and network passphrase
- **Fix:** Check that contracts are deployed on the same network

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Soroban over EVM | Low fees, native USDC, Stellar ecosystem |
| NestJS monorepo | Shared libs (Prisma, Soroban client) across services |
| Polling indexer (not WebSocket) | Simpler, more reliable for MVP |
| BullMQ for notifications | Reliable delivery, retries, dead-letter queue |
| Prisma over raw SQL | Type safety, migrations, multi-db support |
| Zustand + TanStack Query | Minimal boilerplate, clear separation of client/server state |
