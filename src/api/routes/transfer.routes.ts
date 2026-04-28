import type { FastifyInstance } from "fastify";
import type { Queue } from "effect";
import type { NotificationJob } from "../../workers/queue";
import { makeTransferController } from "../controllers/transfer.controller";

export const transferRoutes =
  (jobQueue: Queue.Queue<NotificationJob>) => async (app: FastifyInstance) => {
    const controller = makeTransferController(jobQueue);
    app.post("/transfers", controller.transferFundsHandler);
    app.get("/transfers/:reference", controller.getTransferHandler);
  };
