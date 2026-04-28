import { Effect, Queue } from "effect";
import type { FastifyRequest, FastifyReply } from "fastify";
import {
  InvalidAmount,
  SameWalletTransfer,
  InsufficientFunds,
  DuplicateReference,
  WalletNotFound,
  DatabaseFailure,
} from "../../domain/errors";
import { transferFunds } from "../../applications/usecases/transferFunds";
import type { NotificationJob } from "../../workers/queue";
import { TransferRepositoryLive } from "../../infrastructure/repositories/transfer.repository";

export const makeTransferController = (
  jobQueue: Queue.Queue<NotificationJob>,
) => ({
  transferFundsHandler: async (
    req: FastifyRequest<{
      Body: {
        reference: string;
        fromWalletId: string;
        toWalletId: string;
        amount: number;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const { reference, fromWalletId, toWalletId, amount } = req.body;

    return await Effect.runPromise(
      transferFunds(
        { reference, fromWalletId, toWalletId, amount },
        jobQueue,
      ).pipe(
        Effect.match({
          onFailure: (error) => {
            if (error instanceof InvalidAmount) {
              return reply.status(400).send({ error: "Invalid amount" });
            }
            if (error instanceof SameWalletTransfer) {
              return reply
                .status(400)
                .send({ error: "Cannot transfer to same wallet" });
            }
            if (error instanceof InsufficientFunds) {
              return reply.status(400).send({ error: "Insufficient funds" });
            }
            if (error instanceof DuplicateReference) {
              return reply.status(409).send({ error: "Duplicate reference" });
            }
            if (error instanceof WalletNotFound) {
              return reply.status(404).send({ error: "Wallet not found" });
            }
            if (error instanceof DatabaseFailure) {
              return reply.status(500).send({ error: "Database error" });
            }
            return reply.status(400).send({ error: "Bad request" });
          },
          onSuccess: (transfer) => reply.status(201).send(transfer),
        }),
      ),
    );
  },
  getTransferHandler: async (
    req: FastifyRequest<{ Params: { reference: string } }>,
    reply: FastifyReply,
  ) => {
    const { reference } = req.params;

    return await Effect.runPromise(
      TransferRepositoryLive.findByReference(reference).pipe(
        Effect.match({
          onFailure: () => reply.status(500).send({ error: "Database error" }),
          onSuccess: (transfer) => {
            if (!transfer) {
              return reply.status(404).send({ error: "Transfer not found" });
            }
            return reply.status(200).send(transfer);
          },
        }),
      ),
    );
  },
});
