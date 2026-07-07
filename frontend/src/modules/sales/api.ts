import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { Sale, SaleCreateBody, SaleUpdateBody } from "@/modules/sales/type";

const endpoint = '/sales';

export const create = async (body: SaleCreateBody) => {
  try {
    const response = await api.post<ApiResponse<{ uid: string }>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: Sale["uid"]) => {
  try {
    const response = await api.get<ApiResponse<Sale>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Sale>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const update = async (body: SaleUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, get, getAll, update }
