import { t } from "elysia";
import DataGridSchema from "../../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    client_uid: t.String({ minLength: 32, maxLength: 32 }),
    name: t.String({ minLength: 1, maxLength: 50 })
});

const region = t.Object({
    uid: t.String(),
    ...createBody.properties,
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: region.properties.uid
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    client_uid: t.String()
});

export default { 
    data: {
        value: region
    },
    create: {
        validation: {
            permission: 'clients.create',
            body: createBody
        }
    },
    get: {
        validation: {
            permission: 'clients.access',
            params: getParams
        }
    },
    getAll: {
        validation: {
            permission: 'clients.access',
            query: getAllQuery
        }
    }
};