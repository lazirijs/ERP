import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { ClientType, ClientCreateBodyType, ClientUpdateBodyType } from './type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';

export default {
    async create(input: ClientCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("INSERT INTO clients (name) VALUES (?)").bind(input.name).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: ClientType["uid"]): Promise<SuccessServiceResponse<ClientType>> {
        try {
            const result = await database.prepare(`
                SELECT 
                    c.*,
                    COUNT(p.uid) AS total_projects
                FROM clients c
                LEFT JOIN projects p ON c.uid = p.client_uid
                WHERE c.uid = ?
                GROUP BY c.uid;
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Client not found", 404);
            return Responses.service.handler.success(result as ClientType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: DataGridQuery): Promise<SuccessServiceResponse<DataGridResponse<ClientType>>> {
        try {
            const tableName = "clients";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`
                SELECT 
                    c.*,
                    COUNT(p.uid) AS total_projects
                FROM clients c
                LEFT JOIN projects p ON c.uid = p.client_uid                
                
            `];
            let filter: string;
            let orderBy: string;
            let result;

            if (inputs.searchText) {
                inputs.searchText = `%${ inputs.searchText }%`;
                filter = `WHERE c.name LIKE ?`;
                query.push(filter);
            }

            query.push("GROUP BY c.uid");
            
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
                const countQuery = `SELECT COUNT(*) as count FROM ${tableName} c`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, filter!].join(" ")).bind(inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).first() as { count: number };
            }

            // console.log(countResult);

            return Responses.service.handler.success({
                data: result.results as ClientType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<ClientType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(body: ClientUpdateBodyType) {
        try {
            const result = await database.prepare(`
                UPDATE clients
                SET name = ?
                WHERE uid = ?
            `).bind(body.name, body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}