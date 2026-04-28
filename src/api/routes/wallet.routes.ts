import type { FastifyInstance } from "fastify";
import {
  fundWalletHandler,
  getWalletHandler,
} from "../controllers/wallet.controller";

export const walletRoutes = async (app: FastifyInstance) => {
  app.post("/wallets/fund", fundWalletHandler);
  app.get("/wallets/:id", getWalletHandler);
};
