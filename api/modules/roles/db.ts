import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { RoleType, RoleDetailType, RoleCreateBodyType, RoleUpdateBodyType } from './type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';
import { buildDataGridSQLiteConditions } from '../../utils/devextreme/datagrid/service';

export default {
    async create(input: RoleCreateBodyType): Promise<SuccessServiceResponse<{ uid: string }>> {
        try {
            const role = await database
                .prepare("INSERT INTO roles (name, description) VALUES (?, ?) RETURNING uid")
                .bind(input.name, input.description || null)
                .first<{ uid?: string }>();
            if (!role?.uid) throw Responses.service.handler.error("Failed to create role", 500);

            if (input.permission_uids.length) {
                await database.batch(input.permission_uids.map(pid =>
                    database.prepare("INSERT INTO role_permissions (role_uid, permission_uid) VALUES (?, ?)").bind(role.uid!, pid)));
            }
            return Responses.service.handler.success({ uid: role.uid });
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async getByUid(uid: RoleType["uid"]): Promise<SuccessServiceResponse<RoleDetailType>> {
        try {
            const role = await database
                .prepare("SELECT uid, name, description, created_at FROM roles WHERE uid = ?")
                .bind(uid)
                .first<Omit<RoleDetailType, "permission_uids">>();
            if (!role) throw Responses.service.handler.error("Role not found", 404);

            const perms = await database
                .prepare("SELECT permission_uid FROM role_permissions WHERE role_uid = ?")
                .bind(uid)
                .all<{ permission_uid: string }>();

            return Responses.service.handler.success({
                ...role,
                permission_uids: perms.results.map(p => p.permission_uid)
            });
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getAll(inputs: DataGridQuery): Promise<SuccessServiceResponse<DataGridResponse<RoleType>>> {
        try {
            const limit = "LIMIT " + inputs.take;
            const offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);

            const from = "FROM roles r";

            const query: string[] = [`
                SELECT
                    r.*,
                    (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_uid = r.uid) AS permissions_count
                ${ from }
            `];

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    name: { searchText: 'r.name', values: 'r.name' },
                    description: { searchText: 'r.description', values: 'r.description' },
                    created_at: { searchText: 'r.created_at', values: 'r.created_at' }
                }
            });

            query.push(...conditions);

            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                const sortCol = selector === "permissions_count" ? "permissions_count" : `r.${ selector }`;
                query.push(`ORDER BY ${ sortCol } ${ desc ? "DESC" : "ASC" }`);
            }

            query.push(limit, offset);

            const prepare = database.prepare(query.join(" "));
            const result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = ["SELECT COUNT(*) as count", from, ...conditions].join(" ");
                const countPrepare = database.prepare(countQuery);
                countResult = binds.length
                    ? await countPrepare.bind(...binds).first() as { count: number }
                    : await countPrepare.first() as { count: number };
            }

            return Responses.service.handler.success({
                data: result.results as RoleType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<RoleType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(input: RoleUpdateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            // Replace the whole permission set in one atomic batch alongside the role update.
            await database.batch([
                database.prepare("UPDATE roles SET name = ?, description = ? WHERE uid = ?").bind(input.name, input.description || null, input.uid),
                database.prepare("DELETE FROM role_permissions WHERE role_uid = ?").bind(input.uid),
                ...input.permission_uids.map(pid =>
                    database.prepare("INSERT INTO role_permissions (role_uid, permission_uid) VALUES (?, ?)").bind(input.uid, pid))
            ]);
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async delete(uid: RoleType["uid"]): Promise<SuccessServiceResponse<undefined>> {
        try {
            // role_permissions cascade via FK; detach any users still pointing at this role.
            await database.batch([
                database.prepare("UPDATE users SET role_uid = NULL WHERE role_uid = ?").bind(uid),
                database.prepare("DELETE FROM roles WHERE uid = ?").bind(uid)
            ]);
            return Responses.service.handler.success();
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}
