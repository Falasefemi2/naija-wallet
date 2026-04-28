import type { FastifyInstance } from "fastify";
import { getTransactionHistoryHandler } from "../controllers/transaction.controller";

export const transactionRoutes = async (app: FastifyInstance) => {
  app.get("/transactions/:walletId", getTransactionHistoryHandler);
};
