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
            auth: true,
            body: createBody
        }
    },
    get: {
        validation: {
            auth: true,
            params: getParams
        }
    },
    getAll: {
        validation: {
            auth: true,
            query: DataGridSchema.data
        }
    },
    update: {
        validation: {
            auth: true,
            body: updateBody
        }
    },
    delete: {
        validation: {
            auth: true,
            params: getParams
        }
    }
};
