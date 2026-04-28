import { Effect } from "effect";
import type { FastifyRequest, FastifyReply } from "fastify";
import { DatabaseFailure } from "../../domain/errors";
import { createAccount } from "../../applications/usecases/createAccount";
import { getAccount } from "../../applications/usecases/getAccount";
import { AccountNotFound, WalletNotFound } from "../../domain/errors";

export const createAccountHandler = async (
  req: FastifyRequest<{ Body: { fullName: string; email: string } }>,
  reply: FastifyReply,
) => {
  const { fullName, email } = req.body;

  const result = await Effect.runPromise(
    createAccount({ fullName, email }).pipe(
      Effect.match({
        onFailure: (error) => {
          if (error instanceof DatabaseFailure) {
            return reply.status(500).send({ error: "Database error" });
          }
          return reply.status(400).send({ error: "Bad request" });
        },
        onSuccess: (data) => reply.status(201).send(data),
      }),
    ),
  );

  return result;
};

export const getAccountHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const { id } = req.params;

  const result = await Effect.runPromise(
    getAccount(id).pipe(
      Effect.match({
        onFailure: (error) => {
          if (error instanceof AccountNotFound || error instanceof WalletNotFound) {
            return reply.status(404).send({ error: "Account or Wallet not found" });
          }
          return reply.status(500).send({ error: "Internal Server Error" });
        },
        onSuccess: (data) => reply.status(200).send(data),
      }),
    ),
  );

  return result;
};
