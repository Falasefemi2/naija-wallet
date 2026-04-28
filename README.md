# Naija Wallet Engine

A production-style fintech wallet and transaction processing backend built with TypeScript, Effect TS, Fastify, and PostgreSQL. Simulates core infrastructure found inside digital payment companies like Paystack or Flutterwave.

---

## What This Is

Most backend tutorials teach CRUD. This project teaches **real backend engineering** — typed errors, atomic transactions, idempotency, background workers, and clean architecture with clear separation of concerns.

---

## Tech Stack

| Layer        | Technology                |
| ------------ | ------------------------- |
| Runtime      | Bun                       |
| HTTP Server  | Fastify                   |
| Language     | TypeScript (strict mode)  |
| Effects / DI | Effect TS                 |
| Database     | PostgreSQL + Drizzle ORM  |
| Job Queue    | Effect Queue (in-process) |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  API Layer                  │
│         Routes → Controllers                │
│   Handles HTTP only. No business logic.     │
├─────────────────────────────────────────────┤
│              Application Layer              │
│    createAccount · fundWallet · transfer    │
│   Orchestrates use cases. Calls repos.      │
├─────────────────────────────────────────────┤
│                Domain Layer                 │
│      Entities · Typed Errors · Rules        │
│   Pure business truth. No DB. No HTTP.      │
├─────────────────────────────────────────────┤
│            Infrastructure Layer             │
│    Repositories · PostgreSQL · Logger       │
│   Everything that talks to the outside.     │
└─────────────────────────────────────────────┘
                      │
            ┌─────────┴──────────┐
            │     Worker Layer   │
            │  Notification job  │
            │  Reconciliation    │
            └────────────────────┘
```

The rule: **outer layers depend on inner layers, never the reverse.** The domain layer does not know PostgreSQL exists.

---

## Core Features

### Account & Wallet Creation

- Register an account with name and email
- Wallet is automatically created and linked to the account
- Returns both account and wallet in a single response

### Fund Wallet

- Validates amount is positive
- Increases wallet balance
- Returns updated wallet

### Transfer Funds

The most complex operation — ten sequential steps with full error handling:

1. Validate amount > 0
2. Reject same-wallet transfers
3. Check for duplicate reference (idempotency)
4. Fetch sender wallet
5. Fetch receiver wallet
6. Validate sender has sufficient balance
7. Create transfer record
8. Debit sender
9. Credit receiver
10. Create ledger entry
11. Mark transfer as completed
12. Queue notification job

### Idempotency

Every transfer carries a unique `reference` field. If the same reference is sent twice, the second request is blocked before any money moves. This protects against network retries and double-clicks.

```
POST /transfers { reference: "TXN-001", amount: 5000 }  → 201 Created
POST /transfers { reference: "TXN-001", amount: 5000 }  → 409 Duplicate reference
```

### Typed Error System

No generic exceptions. Every failure has a structured type:

```typescript
AccountNotFound    → 404
WalletNotFound     → 404
InsufficientFunds  → 400
InvalidAmount      → 400
DuplicateReference → 409
SameWalletTransfer → 400
DatabaseFailure    → 500
```

Errors are defined in the domain layer and map cleanly to HTTP responses in the API layer.

### Background Workers

Two workers run alongside the HTTP server using `Effect.runFork`:

**Notification Worker** — picks up jobs from an in-memory Effect Queue after every successful transfer. Retries with exponential backoff (up to 3 attempts) if the job fails.

**Reconciliation Worker** — runs on a 24-hour schedule. Checks every wallet's balance against its ledger credits and logs any discrepancies.

---

## API Reference

### Accounts

```
POST /accounts
Body: { fullName, email }
Returns: { account, wallet }

GET /accounts/:id
Returns: account details
```

### Wallets

```
POST /wallets/fund
Body: { walletId, amount }
Returns: updated wallet

GET /wallets/:id
Returns: { id, balance, currency }
```

### Transfers

```
POST /transfers
Body: { reference, fromWalletId, toWalletId, amount }
Returns: transfer record

GET /transfers/:reference
Returns: transfer by reference
```

---

## Database Schema

```
accounts         → id, fullName, email, createdAt
wallets          → id, accountId, balance, currency, createdAt
transfers        → id, reference (unique), fromWalletId, toWalletId, amount, status, createdAt
ledger_entries   → id, transferId, debitWalletId, creditWalletId, amount, createdAt
idempotency_keys → id, key (unique), response, createdAt
```

---

## Project Structure

```
src/
├── api/
│   ├── controllers/     # Parse requests, map errors to HTTP
│   └── routes/          # Register Fastify routes
├── application/
│   └── usecases/        # Business operations
├── domain/
│   ├── entities/        # TypeScript interfaces for core models
│   └── errors/          # Typed domain errors (Effect Data.TaggedError)
├── infrastructure/
│   ├── db/              # Drizzle schema, client, migrations
│   └── repositories/    # Database access
├── workers/
│   ├── queue.ts                  # Effect Queue setup
│   ├── notificationWorker.ts     # Receipt jobs with retry
│   └── reconciliationWorker.ts   # Daily balance check
└── index.ts             # Server bootstrap
```

---

## Setup

**Prerequisites:** Bun, PostgreSQL

```bash
# Install dependencies
bun install

# Set environment variables
cp .env.example .env
# Edit DATABASE_URL with your PostgreSQL credentials

# Run migrations
bun run db:generate
bun run db:migrate

# Start server
bun --env-file=.env run dev
```

Server runs on `http://localhost:3000`

---

## Engineering Decisions

**Why Effect TS?**
Effect gives us typed errors at the type level — if a function can fail with `InsufficientFunds`, the compiler enforces that callers handle it. No uncaught exceptions, no silent failures.

**Why Drizzle ORM?**
Drizzle is lightweight, fully typed, and gives you SQL when you need it — unlike heavier ORMs that hide what queries are running.

**Why clean architecture?**
Each layer has one job. The transfer logic works the same whether called from an HTTP route, a background worker, or a test. Nothing is coupled to Fastify or PostgreSQL — only the outer layers are.

**Why a reference field for idempotency?**
The client generates the reference before making the request. This means if the network drops and the client retries, the server can detect the duplicate and return the original result — without moving money twice.

---

## What's Next (Planned)

- [ ] Paystack integration for real card funding
- [ ] Resend email receipts in notification worker
- [ ] Redis-backed queue via BullMQ for job persistence
- [ ] Vitest unit and integration tests
- [ ] `GET /transactions/:walletId` — full transaction history
