import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String({ minLength: 1, maxLength: 50 }),
    description: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ])),
    permission_uids: t.Array(t.String({ minLength: 1 }))
});

const role = t.Object({
    uid: t.String(),
    name: t.String(),
    description: t.Nullable(t.String()),
    permissions_count: t.Number(),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: role.properties.uid
});

const updateBody = t.Object({
    uid: role.properties.uid,
    ...createBody.properties
});

export default {
    data: {
        value: role
    },
    create: {
        validation: {
            permission: 'roles.create',
            body: createBody
        }
    },
    get: {
        validation: {
            permission: 'roles.access',
            params: getParams
        }
    },
    getAll: {
        validation: {
            permission: 'roles.access',
            query: DataGridSchema.data
        }
    },
    update: {
        validation: {
            permission: 'roles.update',
            body: updateBody
        }
    },
    delete: {
        validation: {
            permission: 'roles.delete',
            params: getParams
        }
    }
};
