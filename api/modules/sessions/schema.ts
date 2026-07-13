import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    date: t.String({ minLength: 10, maxLength: 10 }),   // 'YYYY-MM-DD'
    note: t.String({ maxLength: 255 })
});

const session = t.Object({
    uid: t.String(),
    date: t.String(),
    note: t.String(),
    total_employees: t.Number(),
    total_absence: t.Number(),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: session.properties.uid
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    from: t.Optional(t.String()),
    to: t.Optional(t.String())
});

const updateBody = t.Object({
    uid: session.properties.uid,
    date: createBody.properties.date,
    note: createBody.properties.note
});

export default {
    data: {
        value: session
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
    },
    update: {
        validation: {
            auth: true,
            body: updateBody
        }
    }
};
