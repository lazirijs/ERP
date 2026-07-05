export interface PurchaseItem {
  uid: string;
  purchase_uid: string;
  product_uid: string;
  price: number;
  quantity: number;
  note?: string;
  total: number;
  product: { uid: string; name: string; image: string | null };
  purchase: { uid: string; name: string };
  supplier: { uid: string; name: string } | null;
  created_at: string;
}

export interface PurchaseItemCreateBody {
  purchase_uid: string;
  product_uid: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface PurchaseItemUpdateBody {
  uid: string;
  product_uid: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface PurchaseItemBatchRow {
  product_uid: string;
  price: number;
  quantity: number;
  note?: string;
}
