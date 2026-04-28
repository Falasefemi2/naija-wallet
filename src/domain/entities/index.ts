export interface Account {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
}

export interface Wallet {
  id: string;
  accountId: string;
  balance: number;
  currency: string;
  createdAt: Date;
}

export interface Transfer {
  id: string;
  reference: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
}

export interface LedgerEntry {
  id: string;
  transferId: string;
  debitWalletId: string;
  creditWalletId: string;
  amount: number;
  createdAt: Date;
}
