export interface Supplier extends SupplierCreateBody {
  uid: string;
  created_at: string;
}

export interface SupplierCreateBody {
  name: string;
  description: string;
  contact: string;
  address: string;
}

export interface SupplierUpdateBody {
  uid: string;
  name: string;
  description: string;
  contact: string;
  address: string;
}
