export interface User {
  uid: string;
  name: string;
  email: string;
  // phone?: string;
  created_at: string;
}

export interface UserCreateBody {
  name: string;
  email: string;
  // phone?: string;
  // password?: string;
}

export type UserUpdateBody = User