import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { AccountType, AccountCreateBodyType, AccountUpdateBodyType } from './type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';

export default {
    async create(input: AccountCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("INSERT INTO accounts (name, description) VALUES (?, ?)").bind(input.name, input.description).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: AccountType["uid"]): Promise<SuccessServiceResponse<AccountType>> {
        try {
            // join: employee
            const result = await database.prepare(`
                SELECT  * FROM accounts
                WHERE uid = ?
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Account not found", 404);
            return Responses.service.handler.success(result as AccountType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: DataGridQuery): Promise<SuccessServiceResponse<DataGridResponse<AccountType>>> {
        try {
            const tableName = "accounts";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`
                SELECT * FROM ${ tableName }
            `];
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
                const countQuery = `SELECT COUNT(*) as count FROM ${ tableName }`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, filter!].join(" ")).bind(inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).first() as { count: number };
            }

            // console.log(countResult);

            return Responses.service.handler.success({
                data: result.results as AccountType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<AccountType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(body: AccountUpdateBodyType) {
        try {
            const result = await database.prepare(`
                UPDATE accounts
                SET name = ?, description = ?
                WHERE uid = ?
            `).bind(body.name, body.description, body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}