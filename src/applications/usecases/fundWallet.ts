import { Effect } from "effect";
import type { Wallet } from "../../domain/entities";
import {
  InvalidAmount,
  type DatabaseFailure,
  type WalletNotFound,
} from "../../domain/errors";
import { WalletRepositoryLive } from "../../infrastructure/repositories/wallet.repository";

interface FundWalletInput {
  walletId: string;
  amount: number;
}

export const fundWallet = (
  input: FundWalletInput,
): Effect.Effect<Wallet, InvalidAmount | WalletNotFound | DatabaseFailure> =>
  Effect.gen(function* () {
    if (input.amount <= 0) {
      yield* Effect.fail(new InvalidAmount({ amount: input.amount }));
    }

    const wallet = yield* WalletRepositoryLive.findById(input.walletId);

    const newBalance = Number(wallet.balance) + input.amount;

    const updated = yield* WalletRepositoryLive.updateBalance(
      input.walletId,
      newBalance,
    );

    return updated;
  });
