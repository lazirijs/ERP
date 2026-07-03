import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    project_uid: t.String(),
    name: t.String({ minLength: 3, maxLength: 255 }),
    status: t.Union([t.Literal(0), t.Literal(1)]),
    note: t.Optional(t.String())
});

const order = t.Object({
    ...createBody.properties,
    uid: t.String(),
    project: t.Object({
        uid: t.String(),
        name: t.String()
    }),
    total_amount: t.Number(),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: order.properties.uid
});

const updateBody = t.Object({
    uid: order.properties.uid,
    name: order.properties.name,
    status: order.properties.status,
    note: order.properties.note
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    project_uid: t.Optional(t.String())
});

export default { 
    data: {
        value: order
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
    },
    update: {
        validation: {
            auth: true,
            body: updateBody
        }
    }
};