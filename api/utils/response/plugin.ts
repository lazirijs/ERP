import { Elysia } from "elysia";
import Service from "./service";
import Schema from "./schema";
import type { ServiceResponse, HttpStatusCodes } from "./type";

export default new Elysia()

.mapResponse({ as: "global" }, ({ set, response }): any => {
    // Skip If already a Response
    if (response instanceof Response) return response;

    if(Schema.data.check(response)) {
        const { success, code, detail } = response as ServiceResponse<any>;
        set.status = code;
        return { success, detail };
    }

    else return response;
})

.onError({ as: "global" }, ({ error }) => {
    // console.log({ error: Schema.data.check(error) ? "ServiceResponse" : "Other" });

    if(Schema.data.check(error)) return error;
    
    const { status } = error as any;
    const code = typeof status === 'number' ? status as HttpStatusCodes["error"] : 500;
    return Service.handler.error(error, code);
})