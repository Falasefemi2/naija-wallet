import { Effect } from "effect";
import { TransferRepositoryLive } from "../../infrastructure/repositories/transfer.repository";
import { DatabaseFailure } from "../../domain/errors";

export const getTransactionHistory = (walletId: string) =>
  Effect.gen(function* () {
    const transfers = yield* TransferRepositoryLive.findByWalletId(walletId);
    return transfers;
  });
