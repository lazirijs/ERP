export interface Permission {
  uid: string;
  key: string;
  name: string;
  parent_uid: string | null;
  created_at: string;
}

// A parent permission with its child actions nested, for the assignment tree.
export interface PermissionNode extends Permission {
  children?: Permission[];
}
