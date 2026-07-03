import type { status } from "./constant";

export interface Order extends OrderCreateBody {
  uid: string;  
  project: {
    uid: string;
    name: string;
  };
  total_amount: number;
  created_at: string;
}

export interface OrderCreateBody {
  project_uid: string;
  name: string;
  status: keyof typeof status;
  note?: string;
}

export interface OrderUpdateBody {
  uid: string;
  name: string;
  status: keyof typeof status;
  note: string;
}

export type OrderList = Omit<Order, "total_amount">[];