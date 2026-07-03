import type { User, UserUpdateBody } from "../users/type";

export interface LoginBody {
  email: string;
  password: string;
}

export interface Profile extends User {
  permissions: string[];
}

export type ProfileUpdateBody = UserUpdateBody;

export interface ChangePasswordBody {
  currentPassword: string;
  confirmPassword: string;
  newPassword: string;
}
