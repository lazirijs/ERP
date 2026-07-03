import { t } from "elysia";
import DataGridSchema from "../../../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    delivery_uid: t.String(),
    item_uid: t.String(),
    quantity: t.Number({ minimum: 1 }),
    unit_price: t.Number({ minimum: 0 }),
    note: t.Optional(t.String())
});

const deliveryItem = t.Object({
    uid: t.String(),
    delivery_uid: t.String(),
    item_uid: t.String(),
    name: t.String(),
    unit: t.String(),
    quantity: t.Number(),
    unit_price: t.Number(),
    total_price: t.Number(),
    note: t.String(),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: deliveryItem.properties.uid
});

const updateBody = t.Object({
    uid: deliveryItem.properties.uid,
    item_uid: deliveryItem.properties.item_uid,
    quantity: deliveryItem.properties.quantity,
    unit_price: deliveryItem.properties.unit_price,
    total_price: deliveryItem.properties.total_price,
    note: deliveryItem.properties.note
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    delivery_uid: t.String()
});

export default { 
    data: {
        value: deliveryItem
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