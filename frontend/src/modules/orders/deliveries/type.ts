import type { status } from "./constant";

export interface Delivery extends DeliveryCreateBody {
  uid: string;
  project: {
    uid: string;
    name: string;
  };
  order: {
    uid: string;
    name: string;
  };
  total_items: number;
  total_amount: number;
  created_at: string;
}

export interface DeliveryCreateBody {
  order_uid: string;
  name: string;
  status: keyof typeof status;
  note?: string;
}

export interface DeliveryUpdateBody {
  uid: string;
  name: string;
  status: keyof typeof status;
  note: string;
}

export type DeliveryList = Omit<Delivery, "project" | "order">[];