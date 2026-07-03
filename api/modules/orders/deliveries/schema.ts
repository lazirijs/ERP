import { t } from "elysia";
import DataGridSchema from "../../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    order_uid: t.String(),
    name: t.String({ minLength: 3, maxLength: 255 }),
    status: t.Number({ minimum: 0, maximum: 1 }),
    note: t.Optional(t.String())
});

const delivery = t.Object({
    uid: t.String(),
    order_uid: t.String(),
    name: t.String(),
    status: t.Number(),
    note: t.String(),
    total_items: t.Number(),
    total_amount: t.Number(),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: delivery.properties.uid
});

const updateBody = t.Object({
    uid: delivery.properties.uid,
    name: delivery.properties.name,
    status: delivery.properties.status,
    note: delivery.properties.note
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    order_uid: t.String()
});

export default { 
    data: {
        value: delivery
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