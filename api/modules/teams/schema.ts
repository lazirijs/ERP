import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String({ minLength: 1, maxLength: 50 }),
    supervisor_uid: t.String({ minLength: 16, maxLength: 16 })
});

const team = t.Object({
    uid: t.String(),
    ...createBody.properties,
    supervisor: t.Object({
        uid: t.String(),
        name: t.String(),
        created_at: t.String({ format: "date-time" })
    }),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: team.properties.uid
});

const updateBody = t.Object({
    uid: team.properties.uid,
    ...createBody.properties
});

export default { 
    data: {
        value: team
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
    update: {
        validation: {
            auth: true,
            body: updateBody
        }
    },
    getAll: {
        validation: {
            auth: true,
            query: DataGridSchema.data
        }
    }
};