import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String({ minLength: 1, maxLength: 50 }),
    client_uid: t.String({ minLength: 32, maxLength: 32 }),
    region_uid: t.Optional(t.String({ minLength: 32, maxLength: 32 })),
    category_uid: t.Optional(t.String({ minLength: 32, maxLength: 32 })),
    status: t.Union([ t.Literal(0), t.Literal(1), t.Literal(2), t.Literal(3) ]),
    offer: t.Optional(t.Number({ default: 0 })),
    note: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ])),
    description: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ]))
});

const project = t.Object({
    uid: t.String(),
    ...createBody.properties,
    total_amount_received: t.Number(),
    total_amount_expensed: t.Number(),
    total_amount_sold: t.Number(),
    client: t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    }),
    region: t.Nullable(t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    })),
    category: t.Nullable(t.Object({
        uid: t.String(),
        parent_uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    })),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: project.properties.uid
});

const updateBody = t.Object({
    uid: project.properties.uid,
    ...createBody.properties
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    client_uid: t.Optional(t.String())
});

const uploadDocumentBody = t.Object({
    file: t.File({ maxSize: "10m" })
});

const documentKeyBody = t.Object({
    document: t.String()
});

export default { 
    data: {
        value: project
    },
    create: {
        validation: {
            permission: 'projects.create',
            body: createBody
        }
    },
    get: {
        validation: {
            permission: 'projects.access',
            params: getParams
        }
    },
    getAll: {
        validation: {
            permission: 'projects.access',
            query: getAllQuery
        }
    },
    update: {
        validation: {
            permission: 'projects.update',
            body: updateBody
        }
    },
    getDocuments: {
        validation: {
            permission: 'projects.access',
            params: getParams
        }
    },
    uploadDocument: {
        validation: {
            permission: 'projects.update',
            params: getParams,
            body: uploadDocumentBody
        }
    },
    deleteDocument: {
        validation: {
            permission: 'projects.update',
            params: getParams,
            body: documentKeyBody
        }
    }
};