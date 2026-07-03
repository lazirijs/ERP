export interface DeliveryItem extends DeliveryItemCreateBody {
  uid: string;
  name: string;
  unit: string;
  total_price: number;
  created_at: string;
}

export interface DeliveryItemCreateBody {
  delivery_uid: string;
  item_uid: string;
  quantity: number;
  unit_price: number;
  note?: string;
}

export interface DeliveryItemUpdateBody {
  uid: string;
  item_uid: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  note: string;
}
