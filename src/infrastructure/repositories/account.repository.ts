import { Context, Effect } from "effect";
import type { Account } from "../../domain/entities";
import { AccountNotFound, DatabaseFailure } from "../../domain/errors";
import { db } from "../db/client";
import { accounts } from "../db/schema";
import { eq } from "drizzle-orm";

export class AccountRepository extends Context.Tag("AccountRepository")<
  AccountRepository,
  {
    create: (data: {
      fullName: string;
      email: string;
    }) => Effect.Effect<Account, DatabaseFailure>;
    findById: (
      id: string,
    ) => Effect.Effect<Account, AccountNotFound | DatabaseFailure>;
  }
>() {}

export const AccountRepositoryLive = {
  create: (data: { fullName: string; email: string }) =>
    Effect.tryPromise({
      try: async () => {
        const [account] = await db.insert(accounts).values(data).returning();
        if (!account) throw new Error("Failed to create account");
        return account as Account;
      },
      catch: (cause) => new DatabaseFailure({ cause }),
    }),
  findById: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const [account] = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, id));
        if (!account) throw new AccountNotFound({ id });
        return account as Account;
      },
      catch: (cause) =>
        cause instanceof AccountNotFound
          ? cause
          : new DatabaseFailure({ cause }),
    }),
};
