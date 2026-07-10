import { status } from "./constant";

export interface Sale {
  uid: string;
  name: string;
  project_uid?: string | null;
  client_uid?: string | null;
  status: keyof typeof status;
  note?: string;
  project?: { uid: string; name: string } | null;
  client?: { uid: string; name: string } | null;
  total_amount: number;
  items_count: number;
  total_amount_received: number;
  total_amount_expensed: number;
  created_at: string;
}

export interface SaleCreateBody {
  name?: string;
  project_uid?: string | null;
  client_uid?: string | null;
  note?: string;
}

export interface SaleUpdateBody {
  uid: string;
  name?: string;
  project_uid?: string | null;
  client_uid?: string | null;
  status: keyof typeof status;
  note?: string;
}
