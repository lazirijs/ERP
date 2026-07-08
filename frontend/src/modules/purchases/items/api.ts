import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { PurchaseItem, PurchaseItemCreateBody, PurchaseItemUpdateBody, PurchaseItemBatchRow } from "./type";

const endpoint = '/purchases/items';

export const create = async (body: PurchaseItemCreateBody) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const createBatch = async (purchase_uid: string, rows: PurchaseItemBatchRow[]) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(`${endpoint}/batch`, { purchase_uid, rows });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: PurchaseItem["uid"]) => {
  try {
    const response = await api.get<ApiResponse<PurchaseItem>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery<{ purchase_uid?: string; product_uid?: string; supplier_uid?: string }>) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<PurchaseItem>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const update = async (body: PurchaseItemUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const remove = async (uid: PurchaseItem["uid"]) => {
  try {
    const response = await api.delete<ApiResponse<undefined>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, createBatch, get, getAll, update, remove }
