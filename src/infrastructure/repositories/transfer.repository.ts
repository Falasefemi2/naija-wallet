import { Context, Effect } from "effect";
import type { Transfer } from "../../domain/entities";
import { DatabaseFailure } from "../../domain/errors";
import { transfers } from "../db/schema";
import { db } from "../db/client";
import { eq, or } from "drizzle-orm";

export class TransferRepository extends Context.Tag("TransferRepository")<
  TransferRepository,
  {
    create: (data: {
      reference: string;
      fromWalletId: string;
      toWalletId: string;
      amount: number;
    }) => Effect.Effect<Transfer, DatabaseFailure>;
    findByReference: (
      reference: string,
    ) => Effect.Effect<Transfer | null, DatabaseFailure>;
    findByWalletId: (
      walletId: string,
    ) => Effect.Effect<Transfer[], DatabaseFailure>;
    updateStatus: (
      id: string,
      status: "completed" | "failed",
    ) => Effect.Effect<Transfer, DatabaseFailure>;
  }
>() {}

export const TransferRepositoryLive = {
  create: (data: {
    reference: string;
    fromWalletId: string;
    toWalletId: string;
    amount: number;
  }) =>
    Effect.tryPromise({
      try: async () => {
        const [transfer] = await db
          .insert(transfers)
          .values({ ...data, amount: data.amount.toString() })
          .returning();
        if (!transfer) throw new Error("Failed to create transfer");
        return { ...transfer, amount: Number(transfer.amount) };
      },
      catch: (cause) => new DatabaseFailure({ cause }),
    }),

  findByReference: (reference: string) =>
    Effect.tryPromise({
      try: async () => {
        const [transfer] = await db
          .select()
          .from(transfers)
          .where(eq(transfers.reference, reference));
        return transfer
          ? { ...transfer, amount: Number(transfer.amount) }
          : null;
      },
      catch: (cause) => new DatabaseFailure({ cause }),
    }),

  findByWalletId: (walletId: string) =>
    Effect.tryPromise({
      try: async () => {
        const results = await db
          .select()
          .from(transfers)
          .where(or(eq(transfers.fromWalletId, walletId), eq(transfers.toWalletId, walletId)));
        return results.map(t => ({ ...t, amount: Number(t.amount) }));
      },
      catch: (cause) => new DatabaseFailure({ cause }),
    }),

  updateStatus: (id: string, status: "completed" | "failed") =>
    Effect.tryPromise({
      try: async () => {
        const [transfer] = await db
          .update(transfers)
          .set({ status })
          .where(eq(transfers.id, id))
          .returning();
        if (!transfer) throw new Error("Failed to update transfer");
        return { ...transfer, amount: Number(transfer.amount) };
      },
      catch: (cause) => {
        console.error("Transfer create error:", cause);
        return new DatabaseFailure({ cause });
      },
    }),
};
