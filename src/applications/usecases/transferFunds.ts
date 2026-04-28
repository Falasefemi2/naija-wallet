import { WalletRepositoryLive } from "../../infrastructure/repositories/wallet.repository";
import { TransferRepositoryLive } from "../../infrastructure/repositories/transfer.repository";
import { LedgerRepositoryLive } from "../../infrastructure/repositories/ledger.repository";
import {
  InvalidAmount,
  InsufficientFunds,
  SameWalletTransfer,
  DuplicateReference,
  WalletNotFound,
  DatabaseFailure,
} from "../../domain/errors";
import { Effect, Queue } from "effect";
import type { Transfer } from "../../domain/entities";
import type { NotificationJob } from "../../workers/queue";

interface TransferFundsInput {
  reference: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
}

export const transferFunds = (
  input: TransferFundsInput,
  jobQueue: Queue.Queue<NotificationJob>,
): Effect.Effect<
  Transfer,
  | InvalidAmount
  | SameWalletTransfer
  | InsufficientFunds
  | DuplicateReference
  | WalletNotFound
  | DatabaseFailure
> =>
  Effect.gen(function* () {
    if (input.amount <= 0) {
      yield* Effect.fail(new InvalidAmount({ amount: input.amount }));
    }

    if (input.fromWalletId === input.toWalletId) {
      yield* Effect.fail(
        new SameWalletTransfer({ walletId: input.fromWalletId }),
      );
    }

    const existing = yield* TransferRepositoryLive.findByReference(
      input.reference,
    );
    if (existing) {
      yield* Effect.fail(
        new DuplicateReference({ reference: input.reference }),
      );
    }

    const sender = yield* WalletRepositoryLive.findById(input.fromWalletId);
    const receiver = yield* WalletRepositoryLive.findById(input.toWalletId);

    if (Number(sender.balance) < input.amount) {
      yield* Effect.fail(
        new InsufficientFunds({
          walletId: input.fromWalletId,
          required: input.amount,
          available: Number(sender.balance),
        }),
      );
    }

    const transfer = yield* TransferRepositoryLive.create({
      reference: input.reference,
      fromWalletId: input.fromWalletId,
      toWalletId: input.toWalletId,
      amount: input.amount,
    });

    yield* WalletRepositoryLive.updateBalance(
      input.fromWalletId,
      Number(sender.balance) - input.amount,
    );

    yield* WalletRepositoryLive.updateBalance(
      input.toWalletId,
      Number(receiver.balance) + input.amount,
    );

    yield* LedgerRepositoryLive.create({
      transferId: transfer.id,
      debitWalletId: input.fromWalletId,
      creditWalletId: input.toWalletId,
      amount: input.amount,
    });

    const completed = yield* TransferRepositoryLive.updateStatus(
      transfer.id,
      "completed",
    );

    yield* Queue.offer(jobQueue, {
      type: "transfer_receipt",
      payload: {
        reference: input.reference,
        fromWalletId: input.fromWalletId,
        toWalletId: input.toWalletId,
        amount: input.amount,
      },
    });

    return completed;
  });
