import Schema from './schema';
import database from '../../../database'
import Responses from '../../../utils/response';
import type { SuccessServiceResponse } from '../../../utils/response/type';
import type { DataGridResponse } from '../../../utils/devextreme/datagrid/type';
import type { DeliveryType, DeliveryCreateBodyType, DeliveryUpdateBodyType, DeliveryGetAllQueryType } from './type';

export default {
    async create(input: DeliveryCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("INSERT INTO deliveries (order_uid, name, status, note) VALUES (?, ?, ?, ?)").bind(input.order_uid, input.name, input.status, input.note ?? '').run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: DeliveryType["uid"]): Promise<SuccessServiceResponse<DeliveryType>> {
        try {
            uid = uid.replaceAll(/"/g, "");
            console.log(uid);
            const result = await database.prepare(`
                SELECT 
                    d.*,
                    COUNT(di.uid) AS total_items,
                    COALESCE(SUM(di.total_price), 0) AS total_amount,
                    json_object('uid', o."uid", 'name', o."name") AS "order",
                    json_object('uid', p."uid", 'name', p."name") AS "project"
                FROM deliveries d
                LEFT JOIN delivery_items di ON d.uid = di.delivery_uid
                LEFT JOIN orders o ON d.order_uid = o.uid
                LEFT JOIN projects p ON o.project_uid = p.uid
                WHERE d.uid = ?
                GROUP BY d.uid
            `).bind(uid.replaceAll(/"/g, "")).first();
            if (!result) throw Responses.service.handler.error("Delivery not found", 404);
            result.order = JSON.parse(result.order as string);
            result.project = JSON.parse(result.project as string);
            return Responses.service.handler.success(result as DeliveryType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: DeliveryGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<DeliveryType>>> {
        try {
            const tableName = "deliveries";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`
                SELECT 
                    d.*,
                    COUNT(di.uid) AS total_items,
                    COALESCE(SUM(di.total_price), 0) AS total_amount
                FROM ${tableName} d
                LEFT JOIN delivery_items di ON d.uid = di.delivery_uid
            `];

            let filter: string = "";
            let groupBy: string = "GROUP BY d.uid";
            let orderBy: string = "";
            let result;

            if (inputs.searchText) {
                inputs.searchText = inputs.searchText.replace(/"/g, "").toLowerCase();
                if (inputs.searchText) {
                    filter = `WHERE search_vector LIKE ?`;
                }
            }

            if (inputs.order_uid) {
                if (filter) filter += ` AND order_uid = ?`;
                else filter = `WHERE order_uid = ?`;
            }

            query.push(filter);
            query.push(groupBy);
            
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
            if (inputs.searchText && inputs.order_uid) {
                result = await prepare.bind(inputs.searchText, inputs.order_uid.replaceAll(/"/g, "")).run();
            } else if (inputs.searchText) {
                result = await prepare.bind(inputs.searchText).run();
            } else if (inputs.order_uid) {
                result = await prepare.bind(inputs.order_uid.replaceAll(/"/g, "")).run();
            } else {
                result = await prepare.run();
            }

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE order_uid = ?`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, `AND search_vector LIKE ?`].join(" ")).bind(inputs.order_uid, inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).bind(inputs.order_uid).first() as { count: number };
            }

            return Responses.service.handler.success({
                data: result.results as DeliveryType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<DeliveryType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(body: DeliveryUpdateBodyType) {
        try {
            const result = await database.prepare(`
                UPDATE deliveries
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