import type { FastifyInstance } from "fastify";
import { createAccountHandler, getAccountHandler } from "../controllers/account.controller";

export const accountRoutes = async (app: FastifyInstance) => {
  app.post("/accounts", createAccountHandler);
  app.get("/accounts/:id", getAccountHandler);
};
