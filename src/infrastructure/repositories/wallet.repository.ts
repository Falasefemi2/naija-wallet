import { Context, Effect } from "effect";
import { wallets } from "../db/schema";
import { db } from "../db/client";
import { DatabaseFailure, WalletNotFound } from "../../domain/errors";
import { eq } from "drizzle-orm";
import type { Wallet } from "../../domain/entities";

export class WalletRepository extends Context.Tag("WalletRepository")<
  WalletRepository,
  {
    create: (data: {
      accountId: string;
    }) => Effect.Effect<Wallet, DatabaseFailure>;
    findById: (
      id: string,
    ) => Effect.Effect<Wallet, WalletNotFound | DatabaseFailure>;
    findByAccountId: (
      accountId: string,
    ) => Effect.Effect<Wallet, WalletNotFound | DatabaseFailure>;
    updateBalance: (
      id: string,
      balance: number,
    ) => Effect.Effect<Wallet, WalletNotFound | DatabaseFailure>;
  }
>() {}

export const WalletRepositoryLive = {
  create: (data: { accountId: string }) =>
    Effect.tryPromise({
      try: async () => {
        const [wallet] = await db.insert(wallets).values(data).returning();
        if (!wallet) throw new Error("Failed to create wallet");
        return { ...wallet, balance: Number(wallet.balance) };
      },
      catch: (cause) => new DatabaseFailure({ cause }),
    }),

  findById: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const [wallet] = await db
          .select()
          .from(wallets)
          .where(eq(wallets.id, id));
        if (!wallet) throw new WalletNotFound({ id });
        return { ...wallet, balance: Number(wallet.balance) };
      },
      catch: (cause) =>
        cause instanceof WalletNotFound
          ? cause
          : new DatabaseFailure({ cause }),
    }),

  findByAccountId: (accountId: string) =>
    Effect.tryPromise({
      try: async () => {
        const [wallet] = await db
          .select()
          .from(wallets)
          .where(eq(wallets.accountId, accountId));
        if (!wallet) throw new WalletNotFound({ id: accountId }); // Reusing WalletNotFound with accountId as ID for now, or could create AccountWalletNotFound
        return { ...wallet, balance: Number(wallet.balance) };
      },
      catch: (cause) =>
        cause instanceof WalletNotFound
          ? cause
          : new DatabaseFailure({ cause }),
    }),

  updateBalance: (id: string, balance: number) =>
    Effect.tryPromise({
      try: async () => {
        const [wallet] = await db
          .update(wallets)
          .set({ balance: balance.toString() })
          .where(eq(wallets.id, id))
          .returning();
        if (!wallet) throw new WalletNotFound({ id });
        return { ...wallet, balance: Number(wallet.balance) };
      },
      catch: (cause) => {
        console.error("Wallet update error:", cause);
        return new DatabaseFailure({ cause });
      },
    }),
};
