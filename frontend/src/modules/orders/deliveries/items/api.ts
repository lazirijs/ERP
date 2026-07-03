import api from "@/api";
import type { ApiResponse } from "@/api/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import type { DeliveryItem, DeliveryItemCreateBody, DeliveryItemUpdateBody } from "./type";

const endpoint = '/orders/deliveries/items';

export const create = async (body: DeliveryItemCreateBody) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: DeliveryItem["uid"]) => {
  try {
    const response = await api.get<ApiResponse<DeliveryItem>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query: { delivery_uid: string } | DevExtremeDataGridRemoteQuery<{ delivery_uid: string }>) => {
  try {
    const queryString = Object.entries({ ...defaultQuery, ...query }).map(([i, j]) => [i, JSON.stringify(j)].join("=")).join("&");
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<DeliveryItem>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

const update = async (body: DeliveryItemUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, get, getAll, update }