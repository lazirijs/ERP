import type { User } from "../users/type";

export interface LoginBody {
  email: string;
  password: string;
}

export interface Profile extends User {
  permissions: string[];
}

// Self-service profile edits never carry role_uid / is_admin — those are admin-only
// (set via the users module), so this stays a narrow, safe subset.
export interface ProfileUpdateBody {
  uid: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  confirmPassword: string;
  newPassword: string;
}
