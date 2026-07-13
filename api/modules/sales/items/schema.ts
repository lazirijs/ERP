import { t } from "elysia";
import DataGridSchema from "../../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    sale_uid: t.String(),
    product_uid: t.String(),
    price: t.Number({ minimum: 0 }),
    quantity: t.Number({ minimum: 1 }),
    note: t.String()
});

const item = t.Object({
    uid: t.String(),
    sale_uid: t.String(),
    product_uid: t.String(),
    price: t.Number(),
    quantity: t.Number(),
    note: t.String(),
    total: t.Number(),
    product: t.Object({
        uid: t.String(),
        name: t.String(),
        image: t.Nullable(t.String())
    }),
    sale: t.Object({
        uid: t.String(),
        name: t.String(),
        status: t.Union([t.Literal(0), t.Literal(1)])
    }),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: item.properties.uid
});

const updateBody = t.Object({
    uid: item.properties.uid,
    product_uid: createBody.properties.product_uid,
    price: createBody.properties.price,
    quantity: createBody.properties.quantity,
    note: createBody.properties.note
});

const batchBody = t.Object({
    sale_uid: t.String(),
    rows: t.Array(t.Object({
        product_uid: t.String(),
        price: t.Number({ minimum: 0 }),
        quantity: t.Number({ minimum: 1 }),
        note: t.String({ maxLength: 255 })
    }))
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    sale_uid: t.Optional(t.String()),
    product_uid: t.Optional(t.String()),
    project_uid: t.Optional(t.String())
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
    batch: {
        validation: {
            auth: true,
            body: batchBody
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
    },
    delete: {
        validation: {
            auth: true,
            params: getParams
        }
    }
};
