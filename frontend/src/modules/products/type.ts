export interface Product {
  uid: string;
  name: string;
  price: number;
  description: string;
  image: string;
  created_at: string;
}

export interface ProductCreateBody {
  name: string;
  price: number;
  description: string;
}

export interface ProductUpdateBody {
  uid: string;
  name: string;
  price: number;
  description: string;
}

export type ProductImage = string;
