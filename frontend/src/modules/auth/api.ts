import api from "@/api";
import type { ApiResponse } from "@/api/type";
import type { ChangePasswordBody, LoginBody, Profile, ProfileUpdateBody } from "./type";

export default class UserApi {
  async login(body: LoginBody) {
    try {
      const response = await api.post<ApiResponse<Profile>>('/auth/login', body);
      return response.data;
    } catch (error: any) {
      throw error.response.data;
    }
  }

  async profile() {
    try {
      const response = await api.get<ApiResponse<Profile>>('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw error.response.data;
    }
  }

  async updateProfile(body: ProfileUpdateBody) {
    try {
      const response = await api.post<ApiResponse<Profile>>('/auth/profile', body);
      return response.data;
    } catch (error: any) {
      throw error.response.data;
    }
  }

  async changePassword(body: ChangePasswordBody) {
    try {
      const response = await api.post<ApiResponse<undefined>>('/auth/password', body);
      return response.data;
    } catch (error: any) {
      throw error.response.data;
    }
  }

  async logout() {
    try {
      const response = await api.get<ApiResponse<undefined>>('/auth/logout');
      return response.data;
    } catch (error: any) {
      throw error.response.data;
    }
  }
}