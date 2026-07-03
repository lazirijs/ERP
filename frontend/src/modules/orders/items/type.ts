export interface Item extends ItemCreateBody {
  uid: string;
  delivered_quantity: number;  
  created_at: string;
}

export interface ItemCreateBody {
  order_uid: string;
  name: string;
  unit: string;
  requested_quantity: number;
  note?: string;
}

export interface ItemUpdateBody {
  uid: string;
  name: string;
  unit: string;
  requested_quantity: number;
  note: string;
}
