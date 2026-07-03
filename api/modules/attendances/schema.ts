import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const attendance = t.Object({
    uid: t.String(),
    total_present: t.Number(),
    total_absent: t.Number(),
    created_at: t.String({ format: "date-time" })
});

const getParams = t.Object({
    uid: attendance.properties.uid
});

const registerBody = t.Object({
    attendance_uid: t.String(),
    employee_uid: t.String(),
    project_uid: t.String(),
    status: t.Union([ t.Literal(0), t.Literal(1) ]),
});

const register = t.Object({
    ...registerBody.properties,
    employee: t.Object({
        uid: t.String(),
        name: t.String()
    }),
    team: t.Object({
        uid: t.String(),
        name: t.String()
    }),
    project: t.Object({
        uid: t.String(),
        name: t.String()
    }),
    created_at: t.String({ format: "date-time" })
});

const getAllRegistersQuery = t.Object({
    ...DataGridSchema.data.properties,
    attendance_uid: t.Optional(t.String())
});

const updateRegisterBody = t.Object({
    attendance_uid: t.String(),
    employee_uid: t.String(),
    project_uid: t.String(),
    status: t.Union([ t.Literal(0), t.Literal(1) ]),
});

const deleteRegisterBody = t.Object({
    attendance_uid: t.String(),
    employee_uid: t.String()
});

export default { 
    data: {
        value: attendance
    },
    create: {
        validation: {
            auth: true,
            params: t.Undefined()
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
    register: {
        value: register,
        validation: {
            auth: true,
            body: registerBody
        }
    },
    updateRegister: {
        validation: {
            auth: true,
            body: updateRegisterBody
        }
    },
    deleteRegister: {
        validation: {
            auth: true,
            body: deleteRegisterBody
        }
    },
    getAllRegisters: {
        validation: {
            auth: true,
            query: getAllRegistersQuery
        }
    }
};
