import { t } from "elysia";
import DataGridSchema from "../../utils/devextreme/datagrid/schema";

const user = t.Object({
    uid: t.String(),
    name: t.String({ minLength: 1, maxLength: 50 }),
    email: t.String({ format: "email" }),
    role_uid: t.Nullable(t.String()),
    is_admin: t.Union([t.Literal(0), t.Literal(1)]),
    status: t.Union([t.Literal(0), t.Literal(1), t.Literal(2)]),
    role: t.Nullable(t.Object({
        uid: t.String(),
        name: t.String()
    })),
    created_at: t.String({ format: "date-time" })
});

const status = t.Union([t.Literal(0), t.Literal(1), t.Literal(2)]);

const password = t.String({ minLength: 6 });

const createBody = t.Object({
    name: user.properties.name,
    email: user.properties.email,
    password: t.Optional(password),
    role_uid: t.Optional(t.Nullable(t.String())),
    is_admin: t.Optional(t.Boolean()),
    status: t.Optional(status)
});

const updateBody = t.Object({
    uid: user.properties.uid,
    name: user.properties.name,
    email: user.properties.email,
    role_uid: t.Optional(t.Nullable(t.String())),
    is_admin: t.Optional(t.Boolean()),
    status: t.Optional(status),
    created_at: t.Optional(user.properties.created_at)
});

const uidParam = t.Object({ uid: user.properties.uid });

const uploadProfilePictureBody = t.Object({
    file: t.File({
        type: "image/*",
        maxSize: "5m"
    })
});

export default {
    data: {
        value: user,
        password,
        safe: user
    },
    create: {
        value: createBody,
        validation: {
            auth: true as const,
            body: createBody
        }
    },
    update: {
        value: updateBody,
        validation: {
            auth: true,
            body: updateBody
        }
    },
    get: {
        validation: {
            auth: true,
            params: uidParam
        }
    },
    delete: {
        validation: {
            auth: true,
            params: uidParam
        }
    },
    getAll: {
        validation: {
            auth: true,
            query: DataGridSchema.data
        }
    },
    uploadProfilePicture: {
        validation: {
            auth: true,
            params: uidParam,
            body: uploadProfilePictureBody
        }
    }
};
