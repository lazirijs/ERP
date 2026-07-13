import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    project_uid: t.String(),
    account_uid: t.String(),
    employee_uid: t.String(),
    sale_uid: t.String(),
    purchase_uid: t.String(),
    type: t.Union([t.Literal("+"), t.Literal("-")]),
    amount: t.Number({ minimum: 0 }),
    note: t.String()
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
    sale: t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    }),
    purchase: t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    }),
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