import { t } from "elysia";

const permission = t.Object({
    uid: t.String(),
    key: t.String(),
    name: t.String(),
    parent_uid: t.Nullable(t.String()),
    created_at: t.String({ format: "date-time" })
});

export default {
    data: {
        value: permission
    },
    getAll: {
        validation: {
            permission: 'roles.access'
        }
    }
};
