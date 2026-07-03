import database from '../../database'
import storage from '../../storage'
import Schema from "./schema"
import Services from '../../utils/services'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';
import type { UserType, UserCreateBodyType, UserSafeType, UserUpdateBodyType } from './type'

export default {
    async create(inputs: UserCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            const hashPassword = await Services.password.hash(inputs.password || "123456");
            await database.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").bind(inputs.name, inputs.email, hashPassword).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: UserType["uid"]): Promise<SuccessServiceResponse<UserSafeType>> {
        try {
            const result = await database.prepare("SELECT uid, name, email, created_at FROM users WHERE uid = ?").bind(uid).first();
            if (!result) throw Responses.service.handler.error("User not found", 404);
            return Responses.service.handler.success(result as UserSafeType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: DataGridQuery): Promise<SuccessServiceResponse<DataGridResponse<UserType>>> {
        try {
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = ["SELECT uid, name, email, created_at FROM users"];
            let filter: string;
            let orderBy: string;
            let result;

            if (inputs.searchText) {
                inputs.searchText = inputs.searchText.replace(/"/g, "").toLowerCase();
                if (inputs.searchText) {
                    inputs.searchText = `%${ inputs.searchText }%`;
                    filter = `WHERE search_vector LIKE ?`;
                    query.push(filter);
                }
            }
            
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                orderBy = `ORDER BY ${ selector } ${ desc ? "DESC" : "ASC" }`;
                query.push(orderBy);
            }
            
            query.push(limit);
            query.push(offset);
            
            // console.log(query.join(" "));
            const prepare = database.prepare(query.join(" "));
            result = inputs.searchText ? await prepare.bind(inputs.searchText).run() : await prepare.run();

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = "SELECT COUNT(*) as count FROM users";
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, filter!].join(" ")).bind(inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).first() as { count: number };
            }

            // console.log(countResult);

            return Responses.service.handler.success({
                data: result.results as UserSafeType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<UserSafeType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(inputs: UserUpdateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("UPDATE users SET name = ?, email = ? WHERE uid = ?").bind(inputs.name, inputs.email, inputs.uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async delete(uid: UserType["uid"]): Promise<SuccessServiceResponse<undefined>> {
        try {
            await this.getByUid(uid);
            await database.prepare("DELETE FROM users WHERE uid = ?").bind(uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async uploadProfilePicture({ uid, file }: { uid: UserType["uid"]; file: File }): Promise<SuccessServiceResponse<undefined>> {
        try {
            const key = `profiles/${ uid }.${ file.type.split("/")[1] }`;

            // Upload to R2 bucket
            await storage.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

            // Save the key/URL to D1
            await database.prepare("UPDATE users SET profile_pic_url = ? WHERE uid = ?").bind(key, uid).run();

            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    }
}