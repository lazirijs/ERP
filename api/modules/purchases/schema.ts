import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String({ minLength: 3, maxLength: 50 }),
    supplier_uid: t.Nullable(t.String({ minLength: 32, maxLength: 32 })),
    note: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ]))
});

const purchase = t.Object({
    uid: t.String(),
    name: t.String(),
    supplier_uid: t.Nullable(t.String()),
    note: t.Nullable(t.String()),
    supplier: t.Nullable(t.Object({
        uid: t.String(),
        name: t.String()
    })),
    total_amount: t.Number(),
    items_count: t.Number(),
    total_amount_expensed: t.Number(),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: purchase.properties.uid
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    supplier_uid: t.Optional(t.String())
});

const updateBody = t.Object({
    uid: purchase.properties.uid,
    name: createBody.properties.name,
    supplier_uid: createBody.properties.supplier_uid,
    note: createBody.properties.note
});

const batchBody = t.Object({
    rows: t.Array(t.Object({
        supplier_uid: t.Nullable(t.String({ minLength: 32, maxLength: 32 })),
        product_uid: t.String({ minLength: 32, maxLength: 32 }),
        price: t.Number({ minimum: 0 }),
        quantity: t.Number({ minimum: 1 }),
        note: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ])),
    }))
});

const uploadDocumentBody = t.Object({
    file: t.File({ maxSize: "10m" })
});

const documentKeyBody = t.Object({
    document: t.String()
});

export default {
    data: {
        value: purchase
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
    getDocuments: {
        validation: {
            auth: true,
            params: getParams
        }
    },
    uploadDocument: {
        validation: {
            auth: true,
            params: getParams,
            body: uploadDocumentBody
        }
    },
    deleteDocument: {
        validation: {
            auth: true,
            params: getParams,
            body: documentKeyBody
        }
    }
};
