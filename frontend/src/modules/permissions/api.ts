import api from "@/api";
import type { ApiResponse } from "@/api/type";
import type { Permission } from "@/modules/permissions/type";

const endpoint = '/permissions';

export const getAll = async () => {
  try {
    const response = await api.get<ApiResponse<Permission[]>>(endpoint);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default { getAll };
