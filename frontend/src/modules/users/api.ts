import api from "@/api";
import type { ApiResponse } from "@/api/type";
import type { User, UserCreateBody, UserUpdateBody } from "@/modules/users/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";

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
    const queryString = Object.entries(query).map(([i, j]) => [i, JSON.stringify(j)].join("=")).join("&");
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