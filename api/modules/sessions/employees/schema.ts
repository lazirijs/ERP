import { t } from "elysia";
import DataGridSchema from "../../../utils/devextreme/datagrid/schema";

const status = t.Union([t.Literal(0), t.Literal(1)]);

const createBody = t.Object({
    session_uid: t.String({ minLength: 32, maxLength: 32 }),
    employee_uid: t.String({ minLength: 32, maxLength: 32 }),
    team_uid: t.Optional(t.Union([t.String({ minLength: 32, maxLength: 32 }), t.Null()])),
    status,
    note: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ]))
});

const sessionEmployee = t.Object({
    uid: t.String(),
    session_uid: t.String(),
    employee_uid: t.String(),
    team_uid: t.Nullable(t.String()),
    status,
    note: t.Nullable(t.String()),
    date: t.String(),
    employee: t.Object({ uid: t.String(), name: t.String(), image: t.Nullable(t.String()) }),
    team: t.Nullable(t.Object({ uid: t.String(), name: t.String() })),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: sessionEmployee.properties.uid
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    session_uid: t.Optional(t.String()),
    employee_uid: t.Optional(t.String()),
    from: t.Optional(t.String()),
    to: t.Optional(t.String())
});

const batchBody = t.Object({
    session_uid: t.String({ minLength: 32, maxLength: 32 }),
    rows: t.Array(t.Object({
        employee_uid: t.String({ minLength: 32, maxLength: 32 }),
        team_uid: t.Optional(t.Union([t.String({ minLength: 32, maxLength: 32 }), t.Null()])),
        status,
        note: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ]))
    }))
});

const updateBody = t.Object({
    uid: sessionEmployee.properties.uid,
    status,
    note: t.Optional(t.Union([ t.Literal(""), t.String({ minLength: 3, maxLength: 255 }) ]))
});

export default {
    data: {
        value: sessionEmployee
    },
    create: {
        validation: {
            permission: 'sessions.update',
            body: createBody
        }
    },
    batch: {
        validation: {
            permission: 'sessions.update',
            body: batchBody
        }
    },
    get: {
        validation: {
            permission: 'sessions.access',
            params: getParams
        }
    },
    getAll: {
        validation: {
            permission: 'sessions.access',
            query: getAllQuery
        }
    },
    update: {
        validation: {
            permission: 'sessions.update',
            body: updateBody
        }
    },
    delete: {
        validation: {
            permission: 'sessions.update',
            params: getParams
        }
    }
};
