import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { OrderType, OrderCreateBodyType, OrderUpdateBodyType, OrderGetAllQueryType } from './type';
import type { DataGridResponse } from '../../utils/devextreme/datagrid/type';

export default {
    async create(input: OrderCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("INSERT INTO orders (project_uid, name, status, note) VALUES (?, ?, ?, ?)").bind(input.project_uid, input.name, input.status, input.note ?? '').run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: OrderType["uid"]): Promise<SuccessServiceResponse<OrderType>> {
        try {
            const result = await database.prepare(`
                SELECT 
                    o.*,
                    COALESCE(SUM(di.total_price), 0) AS total_amount,
                    json_object('uid', p.uid, 'name', p.name) AS project
                FROM orders o
                LEFT JOIN deliveries d ON o.uid = d.order_uid
                LEFT JOIN delivery_items di ON d.uid = di.delivery_uid
                LEFT JOIN projects p ON o.project_uid = p.uid
                WHERE o.uid = ?
                GROUP BY o.uid
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Order not found", 404);
            result.project = JSON.parse(result.project as string);
            return Responses.service.handler.success(result as OrderType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: OrderGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<OrderType>>> {
        try {
            const tableName = "orders";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`SELECT * FROM ${tableName}`];
            let filter: string = "";
            let orderBy: string = "";
            let result;

            if (inputs.searchText) {
                inputs.searchText = inputs.searchText.replace(/"/g, "").toLowerCase();
                if (inputs.searchText) {
                    filter = `WHERE search_vector LIKE ?`;
                }
            }

            if (inputs.project_uid) {
                if (filter) filter += ` AND project_uid = ?`;
                else filter = `WHERE project_uid = ?`;
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

            console.log(query.join(" "));
            
            const prepare = database.prepare(query.join(" "));
            if (inputs.searchText && inputs.project_uid) {
                result = await prepare.bind(inputs.searchText, inputs.project_uid).run();
            } else if (inputs.searchText) {
                result = await prepare.bind(inputs.searchText).run();
            } else if (inputs.project_uid) {
                result = await prepare.bind(inputs.project_uid.replaceAll(/"/g, "")).run();
            } else {
                result = await prepare.run();
            }

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM ${tableName} ${filter}`;
                const prepareCount = database.prepare(countQuery);
                if (inputs.project_uid && inputs.searchText) {
                    countResult = await prepareCount.bind(inputs.project_uid, inputs.searchText).first() as { count: number };
                } else if (inputs.project_uid || inputs.searchText) {
                    countResult = await prepareCount.bind(inputs.project_uid || inputs.searchText).first() as { count: number };
                }
                else countResult = await prepareCount.first() as { count: number };
            }

            return Responses.service.handler.success({
                data: result.results as OrderType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<OrderType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(body: OrderUpdateBodyType) {
        try {
            const result = await database.prepare(`
                UPDATE orders
                SET name = ?, status = ?, note = ?
                WHERE uid = ?
            `).bind(body.name, body.status, body.note, body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}