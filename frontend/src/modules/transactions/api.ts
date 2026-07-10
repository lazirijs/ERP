import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import type { Transaction, TransactionCreateBody, TransactionGetAllQuery } from "./type";

const endpoint = '/transactions';

export const create = async (body: TransactionCreateBody) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: Transaction["uid"]) => {
  try {
    const response = await api.get<ApiResponse<Transaction>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery<TransactionGetAllQuery>) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Transaction>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

// const update = async (body: Project) => {
//   try {
//     const response = await api.put<ApiResponse<undefined>>(endpoint, body);
//     return response.data;
//   } catch (error: any) {
//     throw error.response.data;
//   }
// }

export default { create, get, getAll }