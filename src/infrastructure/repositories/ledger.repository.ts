import { Context, Effect } from "effect";
import type { LedgerEntry } from "../../domain/entities";
import { DatabaseFailure } from "../../domain/errors";
import { db } from "../db/client";
import { ledgerEntries } from "../db/schema";

export class LedgerRepository extends Context.Tag("LedgerRepository")<
  LedgerRepository,
  {
    create: (data: {
      transferId: string;
      debitWalletId: string;
      creditWalletId: string;
      amount: number;
    }) => Effect.Effect<LedgerEntry, DatabaseFailure>;
  }
>() {}

export const LedgerRepositoryLive = {
  create: (data: {
    transferId: string;
    debitWalletId: string;
    creditWalletId: string;
    amount: number;
  }) =>
    Effect.tryPromise({
      try: async () => {
        const [entry] = await db
          .insert(ledgerEntries)
          .values({ ...data, amount: data.amount.toString() })
          .returning();
        if (!entry) throw new Error("Failed to create ledger entry");
        return { ...entry, amount: Number(entry.amount) };
      },
      catch: (cause) => {
        console.error("Ledger create error:", cause);
        return new DatabaseFailure({ cause });
      },
    }),
};
