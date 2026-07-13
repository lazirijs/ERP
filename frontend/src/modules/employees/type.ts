import { status } from "@/modules/employees/constant";

export interface Employee extends EmployeeCreateBody {
  uid: string;
  image: string | null;
  team: {
    uid: string;
    name: string;
  } | null;
  created_at: string;
}

export interface EmployeeCreateBody {
  name: string;
  team_uid: string;
  status: keyof typeof status;
}

export interface EmployeeUpdateBody {
  uid: string;
  name: string;
  team_uid: string | null;
  status: keyof typeof status;
}