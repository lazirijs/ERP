import type { Category } from "@/modules/projects/categories/type";
import type { Region } from "@/modules/clients/regions/type";
import { status } from "@/modules/projects/constant";

export interface Project extends ProjectCreateBody {
  uid: string;
  client: {
    uid: string;
    name: string;
    created_at: string;
  };
  region: Region;
  category: Category;
  created_at: string;
  total_amount_received: number;
  total_amount_expensed: number;
  total_amount_sold: number;
}

export interface ProjectCreateBody {
  name: string;
  client_uid: string;
  region_uid: string;
  category_uid: string;
  status: keyof typeof status;
  offer?: number;
  note?: string;
  description?: string;
}

export interface ProjectUpdateBody extends ProjectCreateBody {
  uid: string;
}