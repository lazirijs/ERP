import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { Purchase, PurchaseCreateBody, PurchaseUpdateBody, PurchaseBatchRow } from "@/modules/purchases/type";

const endpoint = '/purchases';

export const create = async (body: PurchaseCreateBody) => {
  try {
    const response = await api.post<ApiResponse<{ uid: string }>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const createBatch = async (rows: PurchaseBatchRow[]) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(`${endpoint}/batch`, { rows });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: Purchase["uid"]) => {
  try {
    const response = await api.get<ApiResponse<Purchase>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery<{ supplier_uid?: string }>) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Purchase>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const update = async (body: PurchaseUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getDocuments = async (uid: Purchase["uid"]) => {
  try {
    const response = await api.get<ApiResponse<string[]>>(`${endpoint}/${uid}/documents`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const uploadDocument = async (uid: Purchase["uid"], file: File) => {
  try {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post<ApiResponse<{ document: string }>>(`${endpoint}/${uid}/documents`, form);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const deleteDocument = async (uid: Purchase["uid"], document: string) => {
  try {
    const response = await api.delete<ApiResponse<undefined>>(`${endpoint}/${uid}/documents`, { data: { document } });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, createBatch, get, getAll, update, getDocuments, uploadDocument, deleteDocument }
