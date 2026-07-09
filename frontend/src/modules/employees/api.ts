import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { Employee, EmployeeCreateBody, EmployeeUpdateBody } from "@/modules/employees/type";
import type { StorageObject } from "@/shared/storage/type";

const endpoint = '/employees';

export const create = async (body: EmployeeCreateBody) => {
  try {
    const response = await api.post<ApiResponse<{ uid: string }>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: Employee["uid"]) => {
  try {
    const response = await api.get<ApiResponse<Employee>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: { team_uid?: string | null } | DevExtremeDataGridRemoteQuery<{ team_uid?: string | null }>) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Employee>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const update = async (body: EmployeeUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getDocuments = async (uid: Employee["uid"]) => {
  try {
    const response = await api.get<ApiResponse<StorageObject[]>>(`${endpoint}/${uid}/documents`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const uploadDocument = async (uid: Employee["uid"], file: File, primary: boolean = false) => {
  try {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post<ApiResponse<{ document: string }>>(`${endpoint}/${uid}/documents?primary=${primary}`, form);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const deleteDocument = async (uid: Employee["uid"], document: string) => {
  try {
    const response = await api.delete<ApiResponse<undefined>>(`${endpoint}/${uid}/documents`, { data: { document } });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, get, getAll, update, getDocuments, uploadDocument, deleteDocument }