import database from '../../database'
import Services from '../../utils/services'
import Responses from '../../utils/response';
import type { UserType } from '../users/type';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { AuthChangePasswordBodyType, AuthRecordType, AuthUidPasswordType, AuthUpdateProfileBodyType } from './type'

export default {
    async getUidPasswordByEmail(email: UserType["email"]): Promise<SuccessServiceResponse<AuthUidPasswordType>> {
        try {
            const user = await database.prepare("SELECT uid, password FROM users WHERE email = ?").bind(email).first();
            if (!user) throw Responses.service.handler.error("User not found", 404);
            return Responses.service.handler.success(user as AuthUidPasswordType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    // The full auth record (safe user fields + password hash + status) keyed by email.
    // Used by the auth/permission macros to re-validate the session against the DB on every
    // request, and by the routes to re-issue the token after self-service profile/password
    // edits. Returns null (never throws) when the account is gone so the caller can log the
    // user out with a tailored message instead of a generic error.
    async getAuthByEmail(email: UserType["email"]): Promise<AuthRecordType | null> {
        const result = await database.prepare(`
            SELECT
                u.uid, u.name, u.email, u.password, u.role_uid, u.is_admin, u.status, u.created_at,
                CASE WHEN u.role_uid IS NOT NULL THEN json_object('uid', r.uid, 'name', r.name) END AS role
            FROM users u
            LEFT JOIN roles r ON u.role_uid = r.uid
            WHERE u.email = ?
        `).bind(email).first();
        if (!result) return null;
        result.role = result.role ? JSON.parse(result.role as string) : null;
        return result as AuthRecordType;
    },

    async updateProfile(uid: UserType["uid"], inputs: AuthUpdateProfileBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            // await database.prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE uid = ?").bind(inputs.name, inputs.email, inputs.phone || null, uid).run();
            await database.prepare("UPDATE users SET name = ?, email = ? WHERE uid = ?").bind(inputs.name, inputs.email, uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async changePassword(uid: UserType["uid"], inputs: AuthChangePasswordBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            const hashPassword = await Services.password.hash(inputs.newPassword);
            await database.prepare("UPDATE users SET password = ? WHERE uid = ?").bind(hashPassword, uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    }
}