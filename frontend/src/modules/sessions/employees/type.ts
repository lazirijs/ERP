import { status } from '../constant';

export interface SessionEmployee {
  uid: string;
  session_uid: string;
  employee_uid: string;
  team_uid: string | null;
  status: keyof typeof status;
  note: string;
  date: string;
  employee: { uid: string; name: string; image: string | null };
  team: { uid: string; name: string } | null;
  created_at: string;
}

export interface SessionEmployeeBatchRow {
  employee_uid: string;
  team_uid: string | null;
  status: keyof typeof status;
  note: string;
}

export interface SessionEmployeeUpdateBody {
  uid: string;
  status: keyof typeof status;
  note: string;
}