import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const createBody = t.Object({
    name: t.String(),
    status: t.Union([ t.Literal(0), t.Literal(1), t.Literal(2), t.Literal(3) ]),
    team_uid: t.Optional(t.Union([ t.String(), t.Null() ]))
});

const employee = t.Object({
    uid: t.String(),
    ...createBody.properties,
    team: t.Optional(t.Object({
        uid: t.String(),
        name: t.String()
    })),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: employee.properties.uid
});

const getAllQuery = t.Object({
    ...DataGridSchema.data.properties,
    team_uid: t.Optional(t.Union([t.String(), t.Null()]))
});

const updateBody = t.Object({
    uid: employee.properties.uid,
    ...createBody.properties
});

export default { 
    data: {
        value: employee
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
            query: getAllQuery
        }
    }
};