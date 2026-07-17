import Schema from './schema';

export type RoleType = typeof Schema.data.value.static;
export type RoleCreateBodyType = typeof Schema.create.validation.body.static;
export type RoleUpdateBodyType = typeof Schema.update.validation.body.static;

// getByUid additionally returns the assigned permission uids (for the edit form).
export type RoleDetailType = Omit<RoleType, "permissions_count"> & { permission_uids: string[] };
