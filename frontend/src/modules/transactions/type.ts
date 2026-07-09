import { type } from "@/modules/transactions/constant";

export interface Transaction extends TransactionCreateBody {
  uid: string;
  project: {
    uid: string;
    name: string;
    created_at: string;
  };
  account?: {
    uid: string;
    name: string;
    created_at: string;
  };
  employee?: {
    uid: string;
    name: string;
    image: string | null;
    created_at: string;
  };
  created_at: string;
}

export interface TransactionCreateBody {
  project_uid: string;
  account_uid?: string;
  employee_uid?: string;
  type: keyof typeof type;
  amount: number;
  note?: string;
}