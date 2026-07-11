import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { TransactionType, TransactionCreateBodyType } from './type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';
import { buildDataGridSQLiteConditions } from '../../utils/devextreme/datagrid/service';

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
    
    async getAll(inputs: DataGridQuery): Promise<SuccessServiceResponse<DataGridResponse<TransactionType>>> {
        try {
            const limit = "LIMIT " + inputs.take;
            const offset = "OFFSET " + inputs.skip;
            let orderBy: string = "";
            let result;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);

            // Shared so the data query and the COUNT query filter over the same joined columns
            // (filter/search conditions may reference p.name, a.name, e.name, s.name, pur.name).
            const from = `
                FROM transactions t
                    LEFT JOIN projects p ON t.project_uid = p.uid
                    LEFT JOIN accounts a ON t.account_uid = a.uid
                    LEFT JOIN employees e ON t.employee_uid = e.uid
                    LEFT JOIN sales s ON t.sale_uid = s.uid
                    LEFT JOIN purchases pur ON t.purchase_uid = pur.uid
            `;

            const query: string[] = [`
                SELECT
                    t.*,
                    json_object('uid', p.uid, 'name', p.name, 'created_at', p.created_at) as project,
                    json_object('uid', a.uid, 'name', a.name, 'created_at', a.created_at) as account,
                    json_object('uid', e.uid, 'name', e.name, 'created_at', e.created_at) as employee,
                    json_object('uid', s.uid, 'name', s.name, 'created_at', s.created_at) as sale,
                    json_object('uid', pur.uid, 'name', pur.name, 'created_at', pur.created_at) as purchase
                ${ from }
            `];

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    'project.name': { searchText: 'p.name', values: 't.project_uid' },
                    'account.name': { searchText: 'a.name', values: 't.account_uid' },
                    'employee.name': { searchText: 'e.name', values: 't.employee_uid' },
                    'sale.name': { searchText: 's.name', values: 't.sale_uid' },
                    'purchase.name': { searchText: 'pur.name', values: 't.purchase_uid' },
                    type: { searchText: 't.type', values: 't.type' },
                    amount: { searchText: 't.amount', values: 't.amount' },
                    note: { searchText: 't.note', values: 't.note' },
                    created_at: { searchText: 't.created_at', values: 't.created_at' }
                },
                excludeColumnsFromSearchText: [...(inputs.excludeColumnsFromSearchText || []), 'type']
            });

            query.push(...conditions);
            
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                orderBy = `ORDER BY ${ selector } ${ desc ? "DESC" : "ASC" }`;
                query.push(orderBy);
            }
            
            query.push(limit);
            query.push(offset);
            
            // console.log(query.join(" "));
            // console.log(binds);

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
                const countQuery = ["SELECT COUNT(*) as count ", from, ...conditions].join(" ");
                const prepare = database.prepare(countQuery);
                if (!binds.length) countResult = await prepare.first() as { count: number };
                else countResult = await prepare.bind(...binds).first() as { count: number };
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