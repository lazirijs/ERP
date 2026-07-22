import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String({ minLength: 3, maxLength: 50 }),
    description: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ])),
    contact: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ])),
    address: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ]))
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
            permission: 'suppliers.create',
            body: createBody
        }
    },
    get: {
        validation: {
            permission: 'suppliers.access',
            params: getParams
        }
    },
    getAll: {
        validation: {
            permission: 'suppliers.access',
            query: getAllQuery
        }
    },
    update: {
        validation: {
            permission: 'suppliers.update',
            body: updateBody
        }
    }
};
