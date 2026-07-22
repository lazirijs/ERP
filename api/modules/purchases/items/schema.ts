import { t } from "elysia";
import DataGridSchema from "../../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    purchase_uid: t.String({ minLength: 32, maxLength: 32 }),
    product_uid: t.String({ minLength: 32, maxLength: 32 }),
    price: t.Number({ minimum: 0 }),
    quantity: t.Number({ minimum: 1 }),
    note: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ]))
});

const item = t.Object({
    uid: t.String(),
    purchase_uid: t.String(),
    product_uid: t.String(),
    price: t.Number(),
    quantity: t.Number(),
    note: t.Nullable(t.String()),
    total: t.Number(),
    product: t.Object({ uid: t.String(), name: t.String(), image: t.Nullable(t.String()) }),
    purchase: t.Object({ uid: t.String(), name: t.String() }),
    supplier: t.Nullable(t.Object({ uid: t.String(), name: t.String() })),
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
    purchase_uid: t.String({ minLength: 32, maxLength: 32 }),
    rows: t.Array(t.Object({
        product_uid: t.String({ minLength: 32, maxLength: 32 }),
        price: t.Number({ minimum: 0 }),
        quantity: t.Number({ minimum: 1 }),
        note: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ]))
    }))
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    purchase_uid: t.Optional(t.String()),
    product_uid: t.Optional(t.String()),
    supplier_uid: t.Optional(t.String())
});

export default {
    data: {
        value: item
    },
    create: {
        validation: {
            permission: 'purchases.update',
            body: createBody
        }
    },
    batch: {
        validation: {
            permission: 'purchases.update',
            body: batchBody
        }
    },
    get: {
        validation: {
            permission: 'purchases.access',
            params: getParams
        }
    },
    getAll: {
        validation: {
            permission: 'purchases.access',
            query: getAllQuery
        }
    },
    update: {
        validation: {
            permission: 'purchases.update',
            body: updateBody
        }
    },
    delete: {
        validation: {
            permission: 'purchases.update',
            params: getParams
        }
    }
};
