import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { Attendance, AttendanceRegisterBody, AttendanceRegisterGetAllQuery } from "./type";

const endpoint = '/attendances';

export const create = async () => {
  try {
    const response = await api.post<ApiResponse<{ uid: string }>>(endpoint);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: Attendance["uid"]) => {
  try {
    const response = await api.get<ApiResponse<Attendance>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Attendance>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

const update = async (inputs: Attendance) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, inputs);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

const register = async (inputs: AttendanceRegisterBody) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(`${endpoint}/register`, inputs);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

const getAllRegisters = async (query: AttendanceRegisterGetAllQuery) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<AttendanceRegisterBody>>>(`${endpoint}/registers?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, get, getAll, update, register, getAllRegisters }