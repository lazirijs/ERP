import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    project_uid: t.String({ minLength: 16, maxLength: 16 }),
    account_uid: t.String({ minLength: 16, maxLength: 16 }),
    employee_uid: t.String({ minLength: 16, maxLength: 16 }),
    sale_uid: t.String({ minLength: 16, maxLength: 16 }),
    purchase_uid: t.String({ minLength: 16, maxLength: 16 }),
    type: t.Union([t.Literal("+"), t.Literal("-")]),
    amount: t.Number({ minimum: 0 }),
    note: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ])),
});

const transaction = t.Object({
    uid: t.String(),
    ...createBody.properties,
    project: t.Nullable(t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    })),
    account: t.Nullable(t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    })),
    employee: t.Nullable(t.Object({
        uid: t.String(),
        name: t.String(),
        image: t.Nullable(t.String()),
        created_at: t.String({ format: "date-time" })
    })),
    sale: t.Nullable(t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    })),
    purchase: t.Nullable(t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    })),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: transaction.properties.uid
});

export default { 
    data: {
        value: transaction
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
    }
};