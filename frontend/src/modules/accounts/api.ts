import api from "@/api";
import type { ApiResponse } from "@/api/type";
import type { Account, AccountCreateBody, AccountUpdateBody } from "@/modules/accounts/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";

const endpoint = '/accounts';

export const create = async (body: AccountCreateBody) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: Account["uid"]) => {
  try {
    const response = await api.get<ApiResponse<Account>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery) => {
  try {
    const queryString = Object.entries({ ...defaultQuery, ...query }).map(([i, j]) => [i, JSON.stringify(j)].join("=")).join("&");
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Account>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const update = async (body: AccountUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, get, getAll, update }