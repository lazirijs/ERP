import database from '../../database'
import storage from '../../storage'
import Schema from "./schema"
import Services from '../../utils/services'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';
import { buildDataGridSQLiteConditions } from '../../utils/devextreme/datagrid/service';
import type { UserType, UserCreateBodyType, UserSafeType, UserUpdateBodyType } from './type'

export default {
    async create(inputs: UserCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            const hashPassword = await Services.password.hash(inputs.password || "123456");
            await database
                .prepare("INSERT INTO users (name, email, password, role_uid, is_admin, status) VALUES (?, ?, ?, ?, ?, ?)")
                .bind(inputs.name, inputs.email, hashPassword, inputs.role_uid || null, inputs.is_admin ? 1 : 0, inputs.status ?? 1)
                .run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async getByUid(uid: UserType["uid"]): Promise<SuccessServiceResponse<UserSafeType>> {
        try {
            const result = await database.prepare(`
                SELECT
                    u.uid, u.name, u.email, u.role_uid, u.is_admin, u.status, u.created_at,
                    CASE WHEN u.role_uid IS NOT NULL THEN json_object('uid', r.uid, 'name', r.name) END AS role
                FROM users u
                LEFT JOIN roles r ON u.role_uid = r.uid
                WHERE u.uid = ?
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("User not found", 404);
            result.role = result.role ? JSON.parse(result.role as string) : null;
            return Responses.service.handler.success(result as UserSafeType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    // The permission keys a user effectively holds, for the auth profile payload.
    // is_admin is a blanket bypass (migration 0031), so an admin resolves to the whole
    // catalog rather than to their role's grants — callers then only ever need to ask
    // "does this user hold this key?" instead of also special-casing admins.
    // Kept out of getByUid on purpose: that result is signed into the auth JWT cookie,
    // and the full catalog would bloat the token.
    async getPermissions(uid: UserType["uid"]): Promise<SuccessServiceResponse<string[]>> {
        try {
            const user = await database
                .prepare("SELECT is_admin, role_uid FROM users WHERE uid = ?")
                .bind(uid)
                .first<{ is_admin: 0 | 1; role_uid: string | null }>();
            if (!user) throw Responses.service.handler.error("User not found", 404);

            if (user.is_admin === 1) {
                const all = await database.prepare("SELECT key FROM permissions").all<{ key: string }>();
                return Responses.service.handler.success(all.results.map(i => i.key));
            }

            if (!user.role_uid) return Responses.service.handler.success<string[]>([]);

            const granted = await database.prepare(`
                SELECT p.key
                FROM role_permissions rp
                JOIN permissions p ON p.uid = rp.permission_uid
                WHERE rp.role_uid = ?
            `).bind(user.role_uid).all<{ key: string }>();

            return Responses.service.handler.success(granted.results.map(i => i.key));
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

            const from = `
                FROM users u
                LEFT JOIN roles r ON u.role_uid = r.uid
            `;

            const query: string[] = [`
                SELECT
                    u.uid, u.name, u.email, u.role_uid, u.is_admin, u.status, u.created_at,
                    CASE WHEN u.role_uid IS NOT NULL THEN json_object('uid', r.uid, 'name', r.name) END AS role
                ${ from }
            `];
            let orderBy: string;
            let result;

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    name: { searchText: 'u.name', values: 'u.name' },
                    email: { searchText: 'u.email', values: 'u.email' },
                    status: { searchText: 'u.status', values: 'u.status' },
                    'role.name': { searchText: 'r.name', values: 'u.role_uid' },
                    created_at: { searchText: 'u.created_at', values: 'u.created_at' }
                },
                excludeColumnsFromSearchText: [...(inputs.excludeColumnsFromSearchText || []), 'status']
            });

            query.push(...conditions);

            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                const sortCol = selector === "role" ? "r.name" : `u.${ selector }`;
                orderBy = `ORDER BY ${ sortCol } ${ desc ? "DESC" : "ASC" }`;
                query.push(orderBy);
            }

            query.push(limit);
            query.push(offset);

            const prepare = database.prepare(query.join(" "));
            result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();
            result.results = (result.results as any[]).map(row => ({ ...row, role: row.role ? JSON.parse(row.role) : null }));

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = ["SELECT COUNT(*) as count", from, ...conditions].join(" ");
                const prepareCount = database.prepare(countQuery);
                countResult = binds.length ? await prepareCount.bind(...binds).first() as { count: number } : await prepareCount.first() as { count: number };
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
            await database
                .prepare("UPDATE users SET name = ?, email = ?, role_uid = ?, is_admin = ?, status = ? WHERE uid = ?")
                .bind(inputs.name, inputs.email, inputs.role_uid || null, inputs.is_admin ? 1 : 0, inputs.status ?? 1, inputs.uid)
                .run();
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