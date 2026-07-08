export interface Client extends ClientCreateBody {
  uid: string;
  total_projects: number;
  created_at: string;
}

export interface ClientCreateBody {
  name: string;
}

export interface ClientUpdateBody {
  uid: string;
  name: string;
}