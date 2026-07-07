export interface SaleItem {
  uid: string;
  sale_uid: string;
  product_uid: string;
  price: number;
  quantity: number;
  note?: string;
  total: number;
  product: { uid: string; name: string; image: string | null };
  sale: { uid: string; name: string };
  created_at: string;
}

export interface SaleItemCreateBody {
  sale_uid: string;
  product_uid: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface SaleItemUpdateBody {
  uid: string;
  product_uid: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface SaleItemBatchRow {
  product_uid: string;
  price: number;
  quantity: number;
  note?: string;
}
