import { t } from "elysia";
import Users from "../users";
import Responses from "../../utils/response";

const loginBody = t.Object({
    email: Users.schema.update.value.properties.email,
    password: Users.schema.data.password
});;

const cookie = t.Optional(t.Object({
    user: Users.schema.data.value,
    expires_at: t.Number()
}));

const updateProfileBody = t.Object({
    name: Users.schema.update.value.properties.name,
    email: Users.schema.update.value.properties.email,
    // phone: Users.schema.update.value.properties.phone
});

const changePasswordBody = t.Object({
    currentPassword: loginBody.properties.password,
    confirmPassword: loginBody.properties.password,
    newPassword: loginBody.properties.password
});

const uidPassword = t.Object({
    uid: Users.schema.data.value.properties.uid,
    password: loginBody.properties.password
});

export default {
    data: {
        value: loginBody,
        uidPassword,
    },
    login: {
        value: loginBody,
        validation: {
            body: loginBody
        }
    },
    cookie,
    updateProfile: {
        value: updateProfileBody,
        validation: {
            auth: true as const,
            body: updateProfileBody
        }
    },
    changePassword: {
        value: changePasswordBody,
        validation: {
            auth: true as const,
            body: changePasswordBody,
            beforeHandle: ({ body }: { body: typeof changePasswordBody.static }) => {
                if (body.confirmPassword !== body.newPassword) {
                    throw Responses.service.handler.error("Passwords do not match", 400);
                }
                else if (body.currentPassword === body.newPassword) {
                    throw Responses.service.handler.error("New password cannot be the same as current password", 400);
                }
            }
        }
    }
}