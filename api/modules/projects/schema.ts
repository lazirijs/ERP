import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String({ minLength: 3, maxLength: 255 }),
    client_uid: t.String({ required: true }),
    region_uid: t.String({ required: true }),
    category_uid: t.String({ required: true }),
    status: t.Union([ t.Literal(0), t.Literal(1), t.Literal(2), t.Literal(3) ]),
    offer: t.Optional(t.Number({ default: 0 })),
    competitor_name: t.Optional(t.String({ default: "" })),
    competitor_offer: t.Optional(t.Number({ default: 0 })),
    guarantee_amount: t.Optional(t.Number({ default: 0 })),
    note: t.Optional(t.String({ default: "" })),
    description: t.Optional(t.String({ default: "" })),
});

const project = t.Object({
    uid: t.String(),
    ...createBody.properties,
    client: t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    }),
    region: t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    }),
    category: t.Object({
        uid: t.String(),
        parent_uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    }),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: project.properties.uid
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    client_uid: t.Optional(t.String())
});

export default { 
    data: {
        value: project
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
    }
};