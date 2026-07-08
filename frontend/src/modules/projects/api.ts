import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { Project, ProjectCreateBody, ProjectUpdateBody } from "@/modules/projects/type";
import type { StorageObject } from "@/shared/storage/type";

const endpoint = '/projects';

export const create = async (body: ProjectCreateBody) => {
  try {
    const response = await api.post<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: Project["uid"]) => {
  try {
    const response = await api.get<ApiResponse<Project>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery<{ client_uid?: string }>) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Project>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const update = async (body: ProjectUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getDocuments = async (uid: Project["uid"]) => {
  try {
    const response = await api.get<ApiResponse<StorageObject[]>>(`${endpoint}/${uid}/documents`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const uploadDocument = async (uid: Project["uid"], file: File) => {
  try {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post<ApiResponse<{ document: string }>>(`${endpoint}/${uid}/documents`, form);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const deleteDocument = async (uid: Project["uid"], document: string) => {
  try {
    const response = await api.delete<ApiResponse<undefined>>(`${endpoint}/${uid}/documents`, { data: { document } });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, get, getAll, update, getDocuments, uploadDocument, deleteDocument }