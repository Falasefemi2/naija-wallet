import Fastify from "fastify";
import { Effect, Queue } from "effect";
import { makeJobQueue } from "./src/workers/queue";
import { accountRoutes } from "./src/api/routes/account.routes";
import { walletRoutes } from "./src/api/routes/wallet.routes";
import { transferRoutes } from "./src/api/routes/transfer.routes";
import { transactionRoutes } from "./src/api/routes/transaction.routes";
import { startNotificationWorker } from "./src/workers/notificationWorker";
import { startReconciliationWorker } from "./src/workers/reconcilationWorker";

const app = Fastify({ logger: true });

const start = Effect.gen(function* () {
  const queue = yield* makeJobQueue;

  app.register(accountRoutes);
  app.register(walletRoutes);
  app.register(transferRoutes(queue));
  app.register(transactionRoutes);
  app.get("/health", async () => ({ status: "ok" }));

  Effect.runFork(startNotificationWorker(queue));
  Effect.runFork(startReconciliationWorker);

  yield* Effect.tryPromise({
    try: () => app.listen({ port: 3000, host: "0.0.0.0" }),
    catch: (cause) => new Error(`Server failed: ${cause}`),
  });

  console.log("Naija Wallet Engine running on port 3000");
});

Effect.runPromise(start).catch(console.error);
