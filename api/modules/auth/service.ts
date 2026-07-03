import Services from '../../utils/services'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { AuthUidPasswordType, AuthLoginBodyType } from "./type";
import db from "./db";

const checkCredentials = async (inputs: AuthLoginBodyType): Promise<SuccessServiceResponse<AuthUidPasswordType>> => {
    try {
        // Verify credentials
        const result = await db.getUidPasswordByEmail(inputs.email);
        const hashedPassword = result.detail.password;
        const isPasswordValid = await Services.password.verify(inputs.password, hashedPassword);
        if(!isPasswordValid) throw Responses.service.handler.error("Invalid credentials", 401);
        return Responses.service.handler.success(result.detail);
    } catch (error: any) {
        if(Responses.schema.data.check(error)) {
            // Handle specific error cases
            if(error.code === 404) throw Responses.service.handler.error("Invalid credentials", 401);
            else throw error;
        }
        throw Responses.service.handler.error(error);
    }
}

export default {
    checkCredentials
}