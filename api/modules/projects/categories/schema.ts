import { t } from "elysia";
import DataGridSchema from "../../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    parent_uid: t.Optional(t.String({ minLength: 32, maxLength: 32 })), // default null
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

export default { 
    data: {
        value: region
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
            query: DataGridSchema.data
        }
    }
};