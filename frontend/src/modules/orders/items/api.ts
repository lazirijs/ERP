import api from "@/api";
import type { ApiResponse } from "@/api/type";
import type { Item, ItemCreateBody, ItemUpdateBody } from "./type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";

const endpoint = '/orders/items';

export const create = async (body: ItemCreateBody) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: Item["uid"]) => {
  try {
    const response = await api.get<ApiResponse<Item>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query: { order_uid: string, getUnusedOnDeliveryUid?: string } | DevExtremeDataGridRemoteQuery<{ order_uid: string, getUnusedOnDeliveryUid?: string }>) => {
  try {
    const queryString = Object.entries({ ...defaultQuery, ...query }).map(([i, j]) => [i, JSON.stringify(j)].join("=")).join("&");
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Item>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

const update = async (body: ItemUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, get, getAll, update }