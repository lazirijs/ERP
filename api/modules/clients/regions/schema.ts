import { t } from "elysia";
import DataGridSchema from "../../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    client_uid: t.String(),
    name: t.String({ minLength: 3, maxLength: 255 })
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