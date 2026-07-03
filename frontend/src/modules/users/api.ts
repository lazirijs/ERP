import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { User, UserCreateBody, UserUpdateBody } from "@/modules/users/type";

const endpoint = '/users';

export const create = async (body: UserCreateBody) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: User["uid"]) => {
  try {
    const response = await api.get<ApiResponse<User>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query: DevExtremeDataGridRemoteQuery) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<User>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const update = async (body: UserUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

// export const delete = async (uid: User["uid"]) => {
//   try {
//     const response = await api.delete<ApiResponse<undefined>>(`${endpoint}/${uid}`);
//     return response.data;
//   } catch (error: any) {
//     throw error.response.data;
//   }
// }

export default {
  create,
  get,
  getAll,
  update,
  // delete,
};