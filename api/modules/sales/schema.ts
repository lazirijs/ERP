import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String({ minLength: 1, maxLength: 50 }),
    project_uid: t.String({ minLength: 32, maxLength: 32 }),
    client_uid: t.String({ minLength: 32, maxLength: 32 }),
    note: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ]))
});

const sale = t.Object({
    uid: t.String(),
    name: t.String(),
    project_uid: t.String(),
    client_uid: t.String(),
    status: t.Union([t.Literal(0), t.Literal(1)]),
    note: t.Nullable(t.String()),
    project: t.Nullable(t.Object({
        uid: t.String(),
        name: t.String()
    })),
    client: t.Nullable(t.Object({
        uid: t.String(),
        name: t.String()
    })),
    total_amount: t.Number(),
    items_count: t.Number(),
    total_amount_received: t.Number(),
    total_amount_expensed: t.Number(),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: sale.properties.uid
});

const updateBody = t.Object({
    uid: sale.properties.uid,
    name: createBody.properties.name,
    project_uid: createBody.properties.project_uid,
    client_uid: createBody.properties.client_uid,
    status: sale.properties.status,
    note: createBody.properties.note
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    project_uid: t.Optional(t.String())
});

export default {
    data: {
        value: sale
    },
    create: {
        validation: {
            permission: 'sales.create',
            body: createBody
        }
    },
    get: {
        validation: {
            permission: 'sales.access',
            params: getParams
        }
    },
    getAll: {
        validation: {
            permission: 'sales.access',
            query: getAllQuery
        }
    },
    update: {
        validation: {
            permission: 'sales.update',
            body: updateBody
        }
    }
};
