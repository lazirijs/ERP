export interface Account extends AccountCreateBody {
  uid: string;
  created_at: string;
}

export interface AccountCreateBody {
  name: string;
  description?: string;
}

export interface AccountUpdateBody {
  uid: string;
  name: string;
  description?: string;
}