import { t } from "elysia";
import DataGridSchema from "../../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    client_uid: t.String({ minLength: 16, maxLength: 16 }),
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