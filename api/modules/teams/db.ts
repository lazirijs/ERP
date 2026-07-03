import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { TeamType, TeamCreateBodyType, TeamUpdateBodyType } from './type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';

export default {
    async create(input: TeamCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("INSERT INTO teams (name, supervisor_uid) VALUES (?, ?)").bind(input.name, input.supervisor_uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: TeamType["uid"]): Promise<SuccessServiceResponse<TeamType>> {
        try {
            // join: employee
            const result = await database.prepare(`
                SELECT 
                    t.*,
                    json_object('uid', e.uid, 'name', e.name, 'created_at', e.created_at) as supervisor
                FROM teams t
                LEFT JOIN employees e ON t.supervisor_uid = e.uid
                WHERE t.uid = ?
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Team not found", 404);
            result.supervisor = JSON.parse(result.supervisor as string);
            return Responses.service.handler.success(result as TeamType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: DataGridQuery): Promise<SuccessServiceResponse<DataGridResponse<TeamType>>> {
        try {
            const tableName = "teams";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`
                SELECT 
                    t.*,
                    json_object('uid', e.uid, 'name', e.name, 'created_at', e.created_at) as supervisor
                FROM ${ tableName } t
                LEFT JOIN employees e ON t.supervisor_uid = e.uid
            `];
            let filter: string;
            let orderBy: string;
            let result;

            if (inputs.searchText) {
                inputs.searchText = `%${ inputs.searchText }%`;
                filter = `WHERE name LIKE ?`;
                query.push(filter);
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

            // parse result
            result.results = result.results.map((team: any) => {
                return {
                    ...team,
                    supervisor: JSON.parse(team.supervisor)
                };
            });

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM ${ tableName }`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, filter!].join(" ")).bind(inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).first() as { count: number };
            }

            // console.log(countResult);

            return Responses.service.handler.success({
                data: result.results as TeamType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<TeamType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(input: TeamUpdateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("UPDATE teams SET name = ?, supervisor_uid = ? WHERE uid = ?").bind(input.name, input.supervisor_uid, input.uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    }
}