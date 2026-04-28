import {
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const transferStatusEnum = pgEnum("transfer_status", [
  "pending",
  "completed",
  "failed",
]);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  balance: numeric("balance", { precision: 20, scale: 4 })
    .notNull()
    .default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("NGN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transfers = pgTable("transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference: varchar("reference", { length: 255 }).notNull().unique(),
  fromWalletId: uuid("from_wallet_id")
    .references(() => wallets.id)
    .notNull(),
  toWalletId: uuid("to_wallet_id")
    .references(() => wallets.id)
    .notNull(),
  amount: numeric("amount", { precision: 20, scale: 4 }).notNull(),
  status: transferStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  transferId: uuid("transfer_id")
    .references(() => transfers.id)
    .notNull(),
  debitWalletId: uuid("debit_wallet_id")
    .references(() => wallets.id)
    .notNull(),
  creditWalletId: uuid("credit_wallet_id")
    .references(() => wallets.id)
    .notNull(),
  amount: numeric("amount", { precision: 20, scale: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const idempotencyKeys = pgTable("idempotency_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  response: varchar("response", { length: 5000 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
