import { Effect, Queue } from "effect";

export interface NotificationJob {
  type: "transfer_receipt";
  payload: {
    reference: string;
    fromWalletId: string;
    toWalletId: string;
    amount: number;
  };
}

export const makeJobQueue = Effect.gen(function* () {
  const queue = yield* Queue.unbounded<NotificationJob>();
  return queue;
});
