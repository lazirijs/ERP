export interface UserRole {
  uid: string;
  name: string;
}

export type UserStatus = 0 | 1 | 2;

export interface User {
  uid: string;
  name: string;
  email: string;
  role_uid: string | null;
  is_admin: 0 | 1;
  status: UserStatus;
  role: UserRole | null;
  created_at: string;
}

export interface UserCreateBody {
  name: string;
  email: string;
  role_uid?: string | null;
  is_admin?: boolean;
  status?: UserStatus;
}

export interface UserUpdateBody {
  uid: string;
  name: string;
  email: string;
  role_uid?: string | null;
  is_admin?: boolean;
  status?: UserStatus;
  created_at?: string;
}
