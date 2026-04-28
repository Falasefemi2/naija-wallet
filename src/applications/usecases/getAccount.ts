import { Effect } from "effect";
import { AccountRepositoryLive } from "../../infrastructure/repositories/account.repository";
import { WalletRepositoryLive } from "../../infrastructure/repositories/wallet.repository";
import { AccountNotFound, WalletNotFound, DatabaseFailure } from "../../domain/errors";

export const getAccount = (id: string) =>
  Effect.gen(function* () {
    const account = yield* AccountRepositoryLive.findById(id);
    const wallet = yield* WalletRepositoryLive.findByAccountId(account.id);

    return {
      ...account,
      wallet,
    };
  });
