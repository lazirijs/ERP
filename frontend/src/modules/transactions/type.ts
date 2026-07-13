import { type } from "@/modules/transactions/constant";

export interface Transaction extends TransactionCreateBody {
  uid: string;
  project: {
    uid: string;
    name: string;
    created_at: string;
  } | null;
  account: {
    uid: string;
    name: string;
    created_at: string;
  } | null;
  employee: {
    uid: string;
    name: string;
    image: string;
    created_at: string;
  } | null;
  sale: {
    uid: string;
    name: string;
    created_at: string;
  } | null;
  purchase: {
    uid: string;
    name: string;
    created_at: string;
  } | null;
  created_at: string;
}

export interface TransactionCreateBody {
  project_uid: string;
  account_uid: string;
  employee_uid: string;
  sale_uid: string;
  purchase_uid: string;
  type: keyof typeof type;
  amount: number;
  note: string;
}

export interface TransactionGetAllQuery {
  project_uid: string;
  account_uid: string;
  employee_uid: string;
  sale_uid: string;
  purchase_uid: string;
}
