import { Elysia } from "elysia";

import Auth from '.';
import Users from '../users';

import Responses from '../../utils/response';
import Services from '../../utils/services'
import type { AuthPluginType } from "./type";

const maxAge = Auth.constant.cookieOptions.maxAge!;

// The signed cookie carries only { email, password (hash), expires_at }; permissions ride
// alongside it in the response body instead, so the token stays small and a role's grants
// take effect on the next profile fetch rather than being frozen into the JWT until it expires.
const withPermissions = async (uid: string) => {
    const user = await Users.db.getByUid(uid);
    const permissions = await Users.db.getPermissions(uid);
    return { user: user.detail, profile: { ...user.detail, permissions: permissions.detail } };
};

// (Re)issue the auth cookie from the DB's current email + password hash. Always reads fresh so
// that after a self-service email/password change the new token matches what the per-request
// macro will re-validate against — otherwise the very next request would look the user up by a
// stale email (or compare a stale hash) and force a logout.
const issueToken = async (
    jwt: { sign: (payload: any) => Promise<string> },
    auth: { set: (options: Record<string, unknown>) => void } | undefined,
    email: string
) => {
    const record = await Auth.db.getAuthByEmail(email);
    if (!record) throw Responses.service.handler.error("User not found", 404);
    const value = await jwt.sign({ email: record.email, password: record.password, expires_at: Date.now() + maxAge });
    auth?.set({ ...Auth.constant.cookieOptions, value });
};

export default (new Elysia({ prefix: "/auth" }) as unknown as AuthPluginType)

// --- Login ---
.post("/login", async ({ body, jwt, cookie: { auth } }) => {
    try {
        const checkCredentials = await Auth.service.checkCredentials(body);
        const { profile } = await withPermissions(checkCredentials.detail.uid);

        // Block inactive accounts at the door too, so they get a clear reason instead of a
        // successful login followed by an immediate re-validation logout on the next request.
        if (profile.status !== 1) throw Responses.service.handler.error("Your account is inactive, please contact an administrator", 403);

        await issueToken(jwt, auth, profile.email);

        return Responses.service.handler.success(profile);
    } catch (error) {
        if(Responses.schema.data.check(error)) throw error;
        throw Responses.service.handler.error(error);
    }
}, Auth.schema.login.validation)

// --- Get profile ---
.get("/profile", async ({ user, jwt, cookie: { auth } }) => {
    try {
        const { profile } = await withPermissions(user.uid);

        await issueToken(jwt, auth, profile.email);

        return Responses.service.handler.success(profile);
    } catch (error) {
        if(Responses.schema.data.check(error)) throw error;
        throw Responses.service.handler.error(error);
    }
}, { auth: true })

// --- Update profile ---
.post("/profile", async ({ user, body, jwt, cookie: { auth } }) => {
    try {
        await Auth.db.updateProfile(user.uid, body);
        const { profile } = await withPermissions(user.uid);

        // Email may have changed — re-issue against the new email so the session stays valid.
        await issueToken(jwt, auth, profile.email);

        return Responses.service.handler.success(profile);
    } catch (error) {
        if(Responses.schema.data.check(error)) throw error;
        throw Responses.service.handler.error(error);
    }
}, Auth.schema.updateProfile.validation)

// --- Update Password ---
.post("/password", async ({ user, body, jwt, cookie: { auth } }) => {
    try {
        // check if current password is correct
        const result = await Auth.db.getUidPasswordByEmail(user.email);
        const isPasswordValid = await Services.password.verify(body.currentPassword, result.detail.password);
        if (!isPasswordValid) throw Responses.service.handler.error("Current password is incorrect", 400);

        await Auth.db.changePassword(user.uid, body);

        // The stored hash just changed — re-issue the cookie with it, otherwise the next request
        // would see a hash mismatch and log the user out right after changing their own password.
        await issueToken(jwt, auth, user.email);

        return Responses.service.handler.success();
    } catch (error) {
        if(Responses.schema.data.check(error)) throw error;
        throw Responses.service.handler.error(error);
    }
}, Auth.schema.changePassword.validation)

// --- Logout ---
.get("/logout", async ({ cookie: { auth } }) => {
    auth?.set({ ...Auth.constant.cookieOptions, value: '', maxAge: 0 });
    return Responses.service.handler.success();
})
