import api from "@/api";
import type { ApiResponse } from "@/api/type";
import type { Category } from "./type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";

const endpoint = '/projects/categories';

export const get = async (uid: Category["uid"]) => {
  try {
    const response = await api.get<ApiResponse<Category>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery) => {
  try {
    const queryString = Object.entries({ ...defaultQuery, ...query }).map(([i, j]) => [i, JSON.stringify(j)].join("=")).join("&");
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Category>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { get, getAll }