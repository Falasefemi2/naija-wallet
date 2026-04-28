import { Data } from "effect";

export class AccountNotFound extends Data.TaggedError("AccountNotFound")<{
  id: string;
}> {}

export class WalletNotFound extends Data.TaggedError("WalletNotFound")<{
  id: string;
}> {}

export class InsufficientFunds extends Data.TaggedError("InsufficientFunds")<{
  walletId: string;
  required: number;
  available: number;
}> {}

export class InvalidAmount extends Data.TaggedError("InvalidAmount")<{
  amount: number;
}> {}

export class DuplicateReference extends Data.TaggedError("DuplicateReference")<{
  reference: string;
}> {}

export class SameWalletTransfer extends Data.TaggedError("SameWalletTransfer")<{
  walletId: string;
}> {}

export class DatabaseFailure extends Data.TaggedError("DatabaseFailure")<{
  cause: unknown;
}> {}
