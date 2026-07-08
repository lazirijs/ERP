import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String({ minLength: 3, maxLength: 50 }),
    description: t.Union([
        t.String({ minLength: 3, maxLength: 100 }),
        t.Literal(""),
    ]),
    contact: t.Union([
        t.String({ minLength: 3, maxLength: 50 }),
        t.Literal(""),
    ]),
    address: t.Union([
        t.String({ minLength: 3, maxLength: 100 }),
        t.Literal(""),
    ])
});

const supplier = t.Object({
    uid: t.String(),
    ...createBody.properties,
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: supplier.properties.uid
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    product_uid: t.Optional(t.String())
});

const updateBody = t.Object({
    uid: supplier.properties.uid,
    name: supplier.properties.name,
    description: supplier.properties.description,
    contact: supplier.properties.contact,
    address: supplier.properties.address
});

export default {
    data: {
        value: supplier
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
