import { Elysia } from "elysia";

import Auth from '.';
import Users from '../users';

import Responses from '../../utils/response';
import Services from '../../utils/services'
import type { AuthPluginType } from "./type";

const maxAge = Auth.constant.cookieOptions.maxAge!;

export default (new Elysia({ prefix: "/auth" }) as unknown as AuthPluginType)

// --- Login ---
.post("/login", async ({ body, jwt, cookie: { auth } }) => {
    try {
        const checkCredentials = await Auth.service.checkCredentials(body);
        const user = await Users.db.getByUid(checkCredentials.detail.uid);
        
        const value = await jwt.sign({ user: user.detail, expires_at: Date.now() + maxAge });
        auth?.set({ ...Auth.constant.cookieOptions, value });

        return user;
    } catch (error) {
        if(Responses.schema.data.check(error)) throw error;
        throw Responses.service.handler.error(error);
    }
}, Auth.schema.login.validation)

// --- Get profile ---
.get("/profile", async ({ user, jwt, cookie: { auth } }) => {
    try {
        const result = await Users.db.getByUid(user.uid);
        
        const value = await jwt.sign({ user: result.detail, expires_at: Date.now() + maxAge });
        auth?.set({ ...Auth.constant.cookieOptions, value });

        return Responses.service.handler.success(result.detail);
    } catch (error) {
        if(Responses.schema.data.check(error)) throw error;
        throw Responses.service.handler.error(error);
    }
}, { auth: true })

// --- Update profile ---
.post("/profile", async ({ user, body, jwt, cookie: { auth } }) => {
    try {
        await Auth.db.updateProfile(user.uid, body);
        const result = await Users.db.getByUid(user.uid);
        
        const value = await jwt.sign({ user: result.detail, expires_at: Date.now() + maxAge });
        auth?.set({ ...Auth.constant.cookieOptions, value });

        return result;
    } catch (error) {
        if(Responses.schema.data.check(error)) throw error;
        throw Responses.service.handler.error(error);
    }
}, Auth.schema.updateProfile.validation)

// --- Update Password ---
.post("/password", async ({ user, body }) => {
    try {
        // check if current password is correct
        const result = await Auth.db.getUidPasswordByEmail(user.email);
        const isPasswordValid = await Services.password.verify(body.currentPassword, result.detail.password);
        if (!isPasswordValid) throw Responses.service.handler.error("Current password is incorrect", 400);

        await Auth.db.changePassword(user.uid, body);
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