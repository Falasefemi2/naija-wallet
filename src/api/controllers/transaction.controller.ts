import { Effect } from "effect";
import type { FastifyRequest, FastifyReply } from "fastify";
import { getTransactionHistory } from "../../applications/usecases/getTransactionHistory";
import { DatabaseFailure } from "../../domain/errors";

export const getTransactionHistoryHandler = async (
  req: FastifyRequest<{ Params: { walletId: string } }>,
  reply: FastifyReply,
) => {
  const { walletId } = req.params;

  const result = await Effect.runPromise(
    getTransactionHistory(walletId).pipe(
      Effect.match({
        onFailure: (error) => {
          if (error instanceof DatabaseFailure) {
            return reply.status(500).send({ error: "Database error" });
          }
          return reply.status(500).send({ error: "Internal Server Error" });
        },
        onSuccess: (data) => reply.status(200).send(data),
      }),
    ),
  );

  return result;
};
