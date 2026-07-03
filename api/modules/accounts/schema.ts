import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String(),
    description: t.Optional(t.String({ default: "" }))
});

const account = t.Object({
    uid: t.String(),
    ...createBody.properties,
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: account.properties.uid
});

const updateBody = t.Object({
    uid: account.properties.uid,
    name: account.properties.name,
    description: account.properties.description
});

export default {
    data: {
        value: account
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
            query: DataGridSchema.data
        }
    },
    update: {
        validation: {
            auth: true,
            body: updateBody
        }
    }
};