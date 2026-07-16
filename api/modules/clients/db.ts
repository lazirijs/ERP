import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { ClientType, ClientCreateBodyType, ClientUpdateBodyType } from './type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';
import { buildDataGridSQLiteConditions } from '../../utils/devextreme/datagrid/service';

export default {
    async create(input: ClientCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database
                .prepare("INSERT INTO clients (name, contact, address) VALUES (?, ?, ?)")
                .bind(input.name, input.contact || null, input.address || null)
                .run();
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
            let orderBy: string;
            let result;

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    name: { searchText: 'c.name', values: 'c.name' },
                    contact: { searchText: 'c.contact', values: 'c.contact' },
                    address: { searchText: 'c.address', values: 'c.address' },
                    created_at: { searchText: 'c.created_at', values: 'c.created_at' }
                }
            });

            query.push(...conditions);
            query.push("GROUP BY c.uid");

            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                orderBy = `ORDER BY ${ selector } ${ desc ? "DESC" : "ASC" }`;
                query.push(orderBy);
            }

            query.push(limit);
            query.push(offset);

            const prepare = database.prepare(query.join(" "));
            result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();

            // total_projects is an aggregate; header-filtering it would need HAVING and is left as-is.
            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = [`SELECT COUNT(*) as count FROM ${ tableName } c`, ...conditions].join(" ");
                const prepareCount = database.prepare(countQuery);
                countResult = binds.length ? await prepareCount.bind(...binds).first() as { count: number } : await prepareCount.first() as { count: number };
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
                SET name = ?, contact = ?, address = ?
                WHERE uid = ?
            `).bind(body.name, body.contact, body.address, body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}