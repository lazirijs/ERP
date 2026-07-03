import Schema from './schema';
import database from '../../../database'
import Responses from '../../../utils/response';
import type { SuccessServiceResponse } from '../../../utils/response/type';
import type { DataGridResponse } from '../../../utils/devextreme/datagrid/type';
import type { ItemType, ItemCreateBodyType, ItemUpdateBodyType, ItemGetAllQueryType } from './type';

export default {
    async create(input: ItemCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("INSERT INTO order_items (order_uid, name, unit, requested_quantity, note) VALUES (?, ?, ?, ?, ?)").bind(input.order_uid, input.name, input.unit, input.requested_quantity, input.note ?? '').run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: ItemType["uid"]): Promise<SuccessServiceResponse<ItemType>> {
        try {
            const result = await database.prepare(`
                SELECT 
                    oi.*,
                    COALESCE(SUM(di.quantity), 0) AS delivered_quantity
                FROM order_items oi
                LEFT JOIN delivery_items di ON oi.uid = di.item_uid
                WHERE oi.uid = ?
                GROUP BY oi.uid
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Item not found", 404);
            return Responses.service.handler.success(result as ItemType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: ItemGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<ItemType>>> {
        try {
            const tableName = "order_items";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`
                SELECT oi.*,
                    COALESCE(SUM(di.quantity), 0) AS delivered_quantity
                FROM order_items oi
                LEFT JOIN delivery_items di ON di.item_uid = oi.uid
                WHERE oi.order_uid = ?
                ${
                    inputs.getUnusedOnDeliveryUid ? `
                        AND NOT EXISTS (
                        SELECT 1
                        FROM delivery_items di2
                        WHERE di2.item_uid = oi.uid
                        AND di2.delivery_uid = ?
                    )` : ""
                }
            `];

            let filter: string = "";
            let groupBy: string = "GROUP BY oi.uid";
            let orderBy: string = "";
            let result;

            if (inputs.searchText) {
                inputs.searchText = `%${ inputs.searchText }%`;
                filter = `AND name LIKE ?`;
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
            if (inputs.searchText && inputs.getUnusedOnDeliveryUid) {
                result = await prepare.bind(inputs.order_uid.replaceAll(/"/g, ""), inputs.getUnusedOnDeliveryUid.replaceAll(/"/g, ""), inputs.searchText).run();
            } else if (inputs.searchText) {
                result = await prepare.bind(inputs.order_uid.replaceAll(/"/g, ""), inputs.searchText).run();
            } else if (inputs.getUnusedOnDeliveryUid) {
                result = await prepare.bind(inputs.order_uid.replaceAll(/"/g, ""), inputs.getUnusedOnDeliveryUid.replaceAll(/"/g, "")).run();
            } else {
                result = await prepare.bind(inputs.order_uid.replaceAll(/"/g, "")).run();
            }

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE order_uid = ?`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, `AND name LIKE ?`].join(" ")).bind(inputs.order_uid, inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).bind(inputs.order_uid).first() as { count: number };
            }

            return Responses.service.handler.success({
                data: result.results as ItemType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<ItemType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(body: ItemUpdateBodyType) {
        try {
            const result = await database.prepare(`
                UPDATE order_items
                SET name = ?, unit = ?, requested_quantity = ?, note = ?
                WHERE uid = ?
            `).bind(body.name, body.unit, body.requested_quantity, body.note, body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}