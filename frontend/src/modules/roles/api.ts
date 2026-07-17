import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { Role, RoleDetail, RoleCreateBody, RoleUpdateBody } from "@/modules/roles/type";

const endpoint = '/roles';

export const create = async (body: RoleCreateBody) => {
  try {
    const response = await api.post<ApiResponse<{ uid: string }>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: Role["uid"]) => {
  try {
    const response = await api.get<ApiResponse<RoleDetail>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Role>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const update = async (body: RoleUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const remove = async (uid: Role["uid"]) => {
  try {
    const response = await api.delete<ApiResponse<undefined>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, get, getAll, update, remove };
