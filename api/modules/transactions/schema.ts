import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    project_uid: t.String(),
    account_uid: t.Optional(t.Nullable(t.String())),
    employee_uid: t.Optional(t.Nullable(t.String())),
    type: t.Union([t.Literal("+"), t.Literal("-")]),
    amount: t.Number(),
    note: t.Optional(t.String({ default: "" }))
});

const transaction = t.Object({
    uid: t.String(),
    ...createBody.properties,
    project: t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    }),
    account: t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    }),
    employee: t.Object({
        uid: t.String(),
        name: t.String(),
        image: t.Nullable(t.String()),
        created_at: t.String({ format: "date-time" })
    }),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: transaction.properties.uid
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    project_uid: t.Optional(t.String()),
    account_uid: t.Optional(t.String()),
    employee_uid: t.Optional(t.String())
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
            query: getAllQuery
        }
    }
};