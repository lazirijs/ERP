import Schema from './schema';
import database from '../../../../database'
import Responses from '../../../../utils/response';
import type { SuccessServiceResponse } from '../../../../utils/response/type';
import type { DataGridResponse } from '../../../../utils/devextreme/datagrid/type';
import type { DeliveryItemType, DeliveryItemCreateBodyType, DeliveryItemUpdateBodyType, DeliveryItemGetAllQueryType } from './type';

export default {
    async create(input: DeliveryItemCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("INSERT INTO delivery_items (delivery_uid, item_uid, quantity, unit_price, total_price, note) VALUES (?, ?, ?, ?, ?, ?)")
                .bind(input.delivery_uid, input.item_uid, input.quantity, input.unit_price, input.quantity * input.unit_price, input.note ?? '').run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: DeliveryItemType["uid"]): Promise<SuccessServiceResponse<DeliveryItemType>> {
        try {
            const result = await database.prepare(`
                SELECT 
                    di.*,
                    oi.name,
                    oi.unit
                FROM delivery_items di
                LEFT JOIN order_items oi ON di.item_uid = oi.uid
                WHERE di.uid = ?
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Delivery item not found", 404);
            return Responses.service.handler.success(result as DeliveryItemType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: DeliveryItemGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<DeliveryItemType>>> {
        try {
            const tableName = "delivery_items";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`
                SELECT 
                    di.*,
                    oi.name,
                    oi.unit
                FROM ${tableName} di
                LEFT JOIN order_items oi ON di.item_uid = oi.uid
            `];

            let filter: string = "";
            let orderBy: string = "";
            let result;

            if (inputs.searchText) {
                inputs.searchText = inputs.searchText.replace(/"/g, "").toLowerCase();
                if (inputs.searchText) {
                    filter = `WHERE search_vector LIKE ?`;
                }
            }

            if (inputs.delivery_uid) {
                if (filter) filter += ` AND delivery_uid = ?`;
                else filter = `WHERE delivery_uid = ?`;
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
            if (inputs.searchText && inputs.delivery_uid) {
                result = await prepare.bind(inputs.searchText, inputs.delivery_uid).run();
            } else if (inputs.searchText) {
                result = await prepare.bind(inputs.searchText).run();
            } else if (inputs.delivery_uid) {
                result = await prepare.bind(inputs.delivery_uid.replaceAll(/"/g, "")).run();
            } else {
                result = await prepare.run();
            }

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE delivery_uid = ?`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, `AND search_vector LIKE ?`].join(" ")).bind(inputs.delivery_uid, inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).bind(inputs.delivery_uid).first() as { count: number };
            }

            return Responses.service.handler.success({
                data: result.results as DeliveryItemType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<DeliveryItemType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(body: DeliveryItemUpdateBodyType) {
        try {
            const result = await database.prepare(`
                UPDATE delivery_items
                SET item_uid = ?, quantity = ?, unit_price = ?, total_price = ?, note = ?
                WHERE uid = ?
            `).bind(body.item_uid, body.quantity, body.unit_price, body.total_price, body.note, body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}