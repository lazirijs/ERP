import { t } from "elysia";
import DataGridSchema from "../../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    order_uid: t.String(),
    name: t.String({ minLength: 1, maxLength: 255 }),
    unit: t.String(),
    requested_quantity: t.Number({ minimum: 1 }),
    note: t.Optional(t.String())
});

const item = t.Object({
    uid: t.String(),
    order_uid: t.String(),
    name: t.String(),
    unit: t.String(),
    requested_quantity: t.Number(),
    note: t.String(),
    delivered_quantity: t.Number(),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: item.properties.uid
});

const updateBody = t.Object({
    uid: item.properties.uid,
    name: item.properties.name,
    unit: item.properties.unit,
    requested_quantity: item.properties.requested_quantity,
    note: item.properties.note
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    order_uid: t.String(),
    getUnusedOnDeliveryUid: t.Optional(t.String())
});

export default { 
    data: {
        value: item
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