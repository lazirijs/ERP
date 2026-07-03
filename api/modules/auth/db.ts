import database from '../../database'
import Services from '../../utils/services'
import Responses from '../../utils/response';
import type { UserType } from '../users/type';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { AuthChangePasswordBodyType, AuthUidPasswordType, AuthUpdateProfileBodyType } from './type'

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