import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { SaleItem, SaleItemCreateBody, SaleItemUpdateBody, SaleItemBatchRow } from "./type";

const endpoint = '/sales/items';

export const create = async (body: SaleItemCreateBody) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const createBatch = async (sale_uid: string, rows: SaleItemBatchRow[]) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(`${endpoint}/batch`, { sale_uid, rows });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: SaleItem["uid"]) => {
  try {
    const response = await api.get<ApiResponse<SaleItem>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery<{ sale_uid?: string; product_uid?: string }>) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<SaleItem>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const update = async (body: SaleItemUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const remove = async (uid: SaleItem["uid"]) => {
  try {
    const response = await api.delete<ApiResponse<undefined>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, createBatch, get, getAll, update, remove }
