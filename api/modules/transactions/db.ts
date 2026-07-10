import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { TransactionType, TransactionCreateBodyType, TransactionGetAllQueryType } from './type';
import type { DataGridResponse } from '../../utils/devextreme/datagrid/type';

export default {
    async create(input: TransactionCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("INSERT INTO transactions (project_uid, account_uid, employee_uid, sale_uid, purchase_uid, type, amount, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(input.project_uid || null, input.account_uid || null, input.employee_uid || null, input.sale_uid || null, input.purchase_uid || null, input.type, input.amount, input.note).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: TransactionType["uid"]): Promise<SuccessServiceResponse<TransactionType>> {
        try {
            // join: project, account, employee
            const result = await database.prepare(`
                SELECT 
                    t.*,
                    json_object('uid', p.uid, 'name', p.name, 'created_at', p.created_at) as project,
                    json_object('uid', a.uid, 'name', a.name, 'created_at', a.created_at) as account,
                    json_object('uid', e.uid, 'name', e.name, 'created_at', e.created_at) as employee,
                    json_object('uid', s.uid, 'name', s.name, 'created_at', s.created_at) as sale,
                    json_object('uid', pr.uid, 'name', pr.name, 'created_at', pr.created_at) as purchase
                FROM transactions t
                LEFT JOIN projects p ON t.project_uid = p.uid
                LEFT JOIN accounts a ON t.account_uid = a.uid
                LEFT JOIN employees e ON t.employee_uid = e.uid
                LEFT JOIN sales s ON t.sale_uid = s.uid
                LEFT JOIN purchases pr ON t.purchase_uid = pr.uid
                WHERE t.uid = ?
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Transaction not found", 404);
            result.project = JSON.parse(result.project as string);
            result.account = JSON.parse(result.account as string);
            result.employee = JSON.parse(result.employee as string);
            return Responses.service.handler.success(result as TransactionType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: TransactionGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<TransactionType>>> {
        try {
            const tableName = "transactions";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`
                SELECT 
                    t.*,
                    json_object('uid', p.uid, 'name', p.name, 'created_at', p.created_at) as project,
                    json_object('uid', a.uid, 'name', a.name, 'created_at', a.created_at) as account,
                    json_object('uid', e.uid, 'name', e.name, 'created_at', e.created_at) as employee,
                    json_object('uid', s.uid, 'name', s.name, 'created_at', s.created_at) as sale,
                    json_object('uid', pur.uid, 'name', pur.name, 'created_at', pur.created_at) as purchase
                FROM transactions t
                    LEFT JOIN projects p ON t.project_uid = p.uid
                    LEFT JOIN accounts a ON t.account_uid = a.uid
                    LEFT JOIN employees e ON t.employee_uid = e.uid
                    LEFT JOIN sales s ON t.sale_uid = s.uid
                    LEFT JOIN purchases pur ON t.purchase_uid = pur.uid
            `];

            let filter: string = "";
            let orderBy: string = "";
            let result;
            const binds: unknown[] = [];

            if (inputs.searchText) {
                inputs.searchText = `%${ inputs.searchText }%`;
                filter = `WHERE name LIKE ?`;
                binds.push(inputs.searchText);
            }

            if (inputs.project_uid) {
                if (filter) filter += ` AND t.project_uid = ?`;
                else filter = `WHERE t.project_uid = ?`;
                binds.push(inputs.project_uid);
            }

            if (inputs.account_uid) {
                if (filter) filter += ` AND t.account_uid = ?`;
                else filter = `WHERE t.account_uid = ?`;
                binds.push(inputs.account_uid);
            }

            if (inputs.employee_uid) {
                if (filter) filter += ` AND t.employee_uid = ?`;
                else filter = `WHERE t.employee_uid = ?`;
                binds.push(inputs.employee_uid);
            }

            if (inputs.sale_uid) {
                if (filter) filter += ` AND t.sale_uid = ?`;
                else filter = `WHERE t.sale_uid = ?`;
                binds.push(inputs.sale_uid);
            }

            if (inputs.purchase_uid) {
                if (filter) filter += ` AND t.purchase_uid = ?`;
                else filter = `WHERE t.purchase_uid = ?`;
                binds.push(inputs.purchase_uid);
            }

            if (inputs.type) {
                if (filter) filter += ` AND t.type = ?`;
                else filter = `WHERE t.type = ?`;
                binds.push(inputs.type);
            }

            query.push(filter);
            
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

            // parse result
            result.results = result.results.map((transaction: any) => {
                return {
                    ...transaction,
                    project: JSON.parse(transaction.project),
                    account: JSON.parse(transaction.account),
                    employee: JSON.parse(transaction.employee),
                    sale: JSON.parse(transaction.sale),
                    purchase: JSON.parse(transaction.purchase)
                };
            });

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM ${tableName} t`;
                if (binds.length) {
                    countResult = await database.prepare([countQuery, filter].join(" ")).bind(...binds).first() as { count: number };
                }
                else countResult = await database.prepare([countQuery, filter].join(" ")).first() as { count: number };
            }

            // console.log(countResult);

            return Responses.service.handler.success({
                data: result.results as TransactionType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<TransactionType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
}