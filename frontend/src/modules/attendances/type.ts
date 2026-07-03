import { status } from './constant';
import type { DevExtremeDataGridRemoteQuery } from '@/components/devextreme/datagrid/type';

export interface Attendance {
  uid: string;
  total_present: number;
  total_absent: number;
  created_at: string;
}

export interface AttendanceRegisterBody {
  attendance_uid: string;
  employee_uid: string;
  project_uid: string;
  status: keyof typeof status;
}

export interface AttendanceRegister extends AttendanceRegisterBody {
  employee: {
    uid: string;
    name: string;
  };
  team: {
    uid: string;
    name: string;
  };
  project: {
    uid: string;
    name: string;
  };
  created_at: string;
}

export interface AttendanceRegisterGetAllQuery extends DevExtremeDataGridRemoteQuery {
  attendance_uid?: string;
  employee_uid?: string;
  project_uid?: string;
}