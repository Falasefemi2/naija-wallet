import { Effect } from "effect";
import type { Account, Wallet } from "../../domain/entities";
import type { DatabaseFailure } from "../../domain/errors";
import { AccountRepositoryLive } from "../../infrastructure/repositories/account.repository";
import { WalletRepositoryLive } from "../../infrastructure/repositories/wallet.repository";

interface CreateAccountInput {
  fullName: string;
  email: string;
}

interface CreateAccountOutput {
  account: Account;
  wallet: Wallet;
}

export const createAccount = (
  input: CreateAccountInput,
): Effect.Effect<CreateAccountOutput, DatabaseFailure> =>
  Effect.gen(function* () {
    const account = yield* AccountRepositoryLive.create({
      fullName: input.fullName,
      email: input.email,
    });
    const wallet = yield* WalletRepositoryLive.create({
      accountId: account.id,
    });
    return { account, wallet };
  });
