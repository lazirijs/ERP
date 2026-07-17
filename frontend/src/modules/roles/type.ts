export interface Role {
  uid: string;
  name: string;
  description: string | null;
  permissions_count: number;
  created_at: string;
}

// getByUid returns the assigned permission uids instead of a count (for the edit form).
export interface RoleDetail {
  uid: string;
  name: string;
  description: string | null;
  permission_uids: string[];
  created_at: string;
}

export interface RoleCreateBody {
  name: string;
  description?: string;
  permission_uids: string[];
}

export interface RoleUpdateBody {
  uid: string;
  name: string;
  description?: string;
  permission_uids: string[];
}
