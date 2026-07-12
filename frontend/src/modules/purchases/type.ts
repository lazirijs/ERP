export interface Purchase {
  uid: string;
  name: string;
  supplier_uid?: string | null;
  note?: string;
  supplier: { uid: string | null; name: string | null }
  total_amount: number;
  items_count: number;
  total_amount_expensed: number;
  created_at: string;
}

export interface PurchaseCreateBody {
  name: string;
  supplier_uid?: string | null;
  note?: string;
}

export interface PurchaseUpdateBody {
  uid: string;
  name: string;
  supplier_uid?: string | null;
  note?: string;
}

export interface PurchaseBatchRow {
  supplier_uid?: string | null;
  product_uid: string;
  price: number;
  quantity: number;
  note?: string;
}
