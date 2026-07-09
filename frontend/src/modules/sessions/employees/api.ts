import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { SessionEmployee, SessionEmployeeBatchRow, SessionEmployeeUpdateBody } from "./type";

const endpoint = '/sessions/employees';

export const get = async (uid: SessionEmployee["uid"]) => {
  try {
    const response = await api.get<ApiResponse<SessionEmployee>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery<{ session_uid?: string; employee_uid?: string; from?: string; to?: string }>) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<SessionEmployee>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const createBatch = async (session_uid: string, rows: SessionEmployeeBatchRow[]) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(`${endpoint}/batch`, { session_uid, rows });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const update = async (body: SessionEmployeeUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const remove = async (uid: SessionEmployee["uid"]) => {
  try {
    const response = await api.delete<ApiResponse<undefined>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { get, getAll, createBatch, update, remove }
