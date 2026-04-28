import { Effect } from "effect";
import type { FastifyRequest, FastifyReply } from "fastify";
import {
  InvalidAmount,
  WalletNotFound,
  DatabaseFailure,
} from "../../domain/errors";
import { fundWallet } from "../../applications/usecases/fundWallet";
import { getWallet } from "../../applications/usecases/getWallet";

export const fundWalletHandler = async (
  req: FastifyRequest<{ Body: { walletId: string; amount: number } }>,
  reply: FastifyReply,
) => {
  const { walletId, amount } = req.body;

  return await Effect.runPromise(
    fundWallet({ walletId, amount }).pipe(
      Effect.match({
        onFailure: (error) => {
          if (error instanceof InvalidAmount) {
            return reply.status(400).send({ error: "Invalid amount" });
          }
          if (error instanceof WalletNotFound) {
            return reply.status(404).send({ error: "Wallet not found" });
          }
          if (error instanceof DatabaseFailure) {
            return reply.status(500).send({ error: "Database error" });
          }
          return reply.status(400).send({ error: "Bad request" });
        },
        onSuccess: (wallet) => reply.status(200).send(wallet),
      }),
    ),
  );
};

export const getWalletHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const { id } = req.params;

  return await Effect.runPromise(
    getWallet(id).pipe(
      Effect.match({
        onFailure: (error) => {
          if (error instanceof WalletNotFound) {
            return reply.status(404).send({ error: "Wallet not found" });
          }
          return reply.status(500).send({ error: "Database error" });
        },
        onSuccess: (wallet) => reply.status(200).send(wallet),
      }),
    ),
  );
};
