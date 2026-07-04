import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { DevExtremeDataGridRemoteDataFormat, DevExtremeDataGridRemoteQuery } from "@/components/devextreme/datagrid/type";
import { defaultQuery } from "@/components/devextreme/datagrid/constant";
import type { Product, ProductCreateBody, ProductUpdateBody, ProductImage } from "@/modules/products/type";

const endpoint = '/products';

export const create = async (body: ProductCreateBody) => {
  try {
    const response = await api.post<ApiResponse<{ uid: string }>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const get = async (uid: Product["uid"]) => {
  try {
    const response = await api.get<ApiResponse<Product>>(`${endpoint}/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getAll = async (query?: DevExtremeDataGridRemoteQuery) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...defaultQuery, ...query });
    const response = await api.get<ApiResponse<DevExtremeDataGridRemoteDataFormat<Product>>>(`${endpoint}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const update = async (body: ProductUpdateBody) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(endpoint, body);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getImages = async (uid: Product["uid"]) => {
  try {
    const response = await api.get<ApiResponse<ProductImage[]>>(`${endpoint}/${uid}/images`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const uploadImage = async (uid: Product["uid"], file: File, primary: boolean = false) => {
  try {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post<ApiResponse<{ image: string }>>(`${endpoint}/${uid}/images?primary=${primary}`, form);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const setPrimaryImage = async (uid: Product["uid"], image: string) => {
  try {
    const response = await api.put<ApiResponse<undefined>>(`${endpoint}/${uid}/images/primary`, { image });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const deleteImage = async (uid: Product["uid"], image: string) => {
  try {
    const response = await api.delete<ApiResponse<undefined>>(`${endpoint}/${uid}/images`, { data: { image } });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { create, get, getAll, update, getImages, uploadImage, setPrimaryImage, deleteImage }
