import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String({ minLength: 1, maxLength: 50 })
});

const client = t.Object({
    uid: t.String(),
    ...createBody.properties,
    total_projects: t.Number(),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: client.properties.uid
});

const updateBody = t.Object({
    uid: client.properties.uid,
    name: client.properties.name
});

export default { 
    data: {
        value: client
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