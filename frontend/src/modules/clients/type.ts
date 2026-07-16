export interface Client extends ClientCreateBody {
  uid: string;
  total_projects: number;
  created_at: string;
}

export interface ClientCreateBody {
  name: string;
  contact: string;
  address: string;
}

export interface ClientUpdateBody {
  uid: string;
  name: string;
  contact: string;
  address: string;
}