import type { HttpStatusCodes } from "./type";
import type { SuccessServiceResponse, ErrorServiceResponse } from "./type";

const handler = {
    success: <T>(detail?: T, code: HttpStatusCodes["success"] = 200): SuccessServiceResponse<T> => {
        if(!detail) return { success: true, code: 201 } as SuccessServiceResponse<T>;
        return { success: true, code, detail };
    },
    
    error: (error: any, code: HttpStatusCodes["error"] = 500): ErrorServiceResponse<any> => {
        const parse = (value: any) => {
            try {
                return JSON.parse(value); // if it's JSON
            } catch {
                return value; // plain string
            }
        }
        const isClassError = error instanceof Error && parse(error.message);
        const isErrorMessage = (typeof isClassError === "string" && isClassError) || (typeof error === "string" && error);
        let message = isErrorMessage;
        if(!error) message = "Unknown error";
        const detail = message ? { message } : error;
        return { success: false, code, detail }
    }
};

export default {
    handler
};