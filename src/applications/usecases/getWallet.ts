import { Effect } from "effect";
import { WalletRepositoryLive } from "../../infrastructure/repositories/wallet.repository";
import type { Wallet } from "../../domain/entities";
import { WalletNotFound, DatabaseFailure } from "../../domain/errors";

export const getWallet = (
  id: string,
): Effect.Effect<Wallet, WalletNotFound | DatabaseFailure> =>
  WalletRepositoryLive.findById(id);
