import api from "@/api";
import type { ApiResponse } from "@/api/type";
import type { Region } from "./type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";

const endpoint = '/clients/regions';

export const get = async (uid: Region["uid"]) => {
  try {
    const response = await api.get<ApiResponse<Region>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query: { client_uid: string } & (DevExtremeDataGridRemoteQuery | {})) => {
  try {    
    const queryString = Object.entries({ ...defaultQuery, ...query }).map(([i, j]) => [i, JSON.stringify(j)].join("=")).join("&");
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Region>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { get, getAll }