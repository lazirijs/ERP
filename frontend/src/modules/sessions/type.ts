export interface Session {
  uid: string;
  date: string;
  note: string;
  total_employees: number;
  total_absence: number;
  created_at: string;
}

export interface SessionCreateBody {
  date: string;
  note: string;
}

export interface SessionUpdateBody {
  uid: string;
  date: string;
  note: string;
}