import { Effect, Schedule } from "effect";
import { db } from "../infrastructure/db/client";
import { wallets, ledgerEntries } from "../infrastructure/db/schema";
import { eq, sql } from "drizzle-orm";

const reconcile = Effect.gen(function* () {
  console.log("[Reconciliation] Starting daily reconciliation...");

  const allWallets = yield* Effect.tryPromise({
    try: () => db.select().from(wallets),
    catch: (cause) => new Error(`DB error: ${cause}`),
  });

  for (const wallet of allWallets) {
    const [ledgerTotal] = yield* Effect.tryPromise({
      try: () =>
        db
          .select({ total: sql<number>`sum(amount)` })
          .from(ledgerEntries)
          .where(eq(ledgerEntries.creditWalletId, wallet.id)),
      catch: (cause) => new Error(`Ledger error: ${cause}`),
    });

    console.log(
      `[Reconciliation] Wallet ${wallet.id} | Balance: ${wallet.balance} | Ledger Credits: ${ledgerTotal?.total ?? 0}`,
    );
  }

  console.log("[Reconciliation] Done.");
});

export const startReconciliationWorker = Effect.gen(function* () {
  console.log("[Worker] Reconciliation worker started");

  yield* reconcile.pipe(
    Effect.repeat(Schedule.fixed("24 hours")),
    Effect.catchAll((error) =>
      Effect.sync(() => console.error("[Reconciliation] Error:", error)),
    ),
  );
});
