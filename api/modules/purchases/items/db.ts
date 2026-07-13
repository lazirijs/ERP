import database from '../../../database'
import Responses from '../../../utils/response';
import type { SuccessServiceResponse } from '../../../utils/response/type';
import type { DataGridResponse } from '../../../utils/devextreme/datagrid/type';
import type { ItemType, ItemCreateBodyType, ItemUpdateBodyType, ItemBatchBodyType, ItemGetAllQueryType } from './type';
import { buildDataGridSQLiteConditions } from '../../../utils/devextreme/datagrid/service';

const parseRow = (row: any) => ({
    ...row,
    product: row.product ? JSON.parse(row.product) : null,
    purchase: row.purchase ? JSON.parse(row.purchase) : null,
    supplier: row.supplier ? JSON.parse(row.supplier) : null
});

const itemsFrom = `
    FROM purchase_items pi
    LEFT JOIN products pr ON pi.product_uid = pr.uid
    LEFT JOIN purchases pu ON pi.purchase_uid = pu.uid
    LEFT JOIN suppliers s ON pu.supplier_uid = s.uid
`;

const selectItem = `
    SELECT
        pi.*,
        (pi.price * pi.quantity) AS total,
        json_object('uid', pu.uid, 'name', pu.name) AS purchase,
        json_object('uid', pr.uid, 'name', pr.name, 'image', pr.image) AS product,
        CASE WHEN pu.supplier_uid IS NOT NULL THEN json_object('uid', s.uid, 'name', s.name) END AS supplier
    ${ itemsFrom }
`;

const sortable: Record<string, string> = {
    price: "pi.price",
    quantity: "pi.quantity",
    total: "total",
    note: "pi.note",
    created_at: "pi.created_at"
};

export default {
    async create(input: ItemCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database
                .prepare("INSERT INTO purchase_items (purchase_uid, product_uid, price, quantity, note) VALUES (?, ?, ?, ?, ?)")
                .bind(input.purchase_uid, input.product_uid, input.price, input.quantity, input.note || null)
                .run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async createBatch({ purchase_uid, rows }: ItemBatchBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            for (const row of rows) {
                await database
                    .prepare("INSERT INTO purchase_items (purchase_uid, product_uid, price, quantity, note) VALUES (?, ?, ?, ?, ?)")
                    .bind(purchase_uid, row.product_uid, row.price, row.quantity, row.note || null)
                    .run();
            }
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async getByUid(uid: ItemType["uid"]): Promise<SuccessServiceResponse<ItemType>> {
        try {
            const result = await database.prepare(`${ selectItem } WHERE pi.uid = ?`).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Item not found", 404);
            return Responses.service.handler.success(parseRow(result) as ItemType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getAll(inputs: ItemGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<ItemType>>> {
        try {
            const limit = "LIMIT " + inputs.take;
            const offset = "OFFSET " + inputs.skip;

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    'purchase.name': { searchText: 'pu.name', values: 'pi.purchase_uid' },
                    'product.name': { searchText: 'pr.name', values: 'pi.product_uid' },
                    'supplier.name': { searchText: 's.name', values: 'pu.supplier_uid' },
                    price: { searchText: 'pi.price', values: 'pi.price' },
                    quantity: { searchText: 'pi.quantity', values: 'pi.quantity' },
                    // total: { searchText: 'pi.total', values: 'pi.total' }, // No such column stored in database
                    note: { searchText: 'pi.note', values: 'pi.note' },
                    created_at: { searchText: 'pi.created_at', values: 'pi.created_at' }
                }
            });

            if (inputs.purchase_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "pi.purchase_uid = ?");
                binds.push(inputs.purchase_uid);
            }
            if (inputs.product_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "pi.product_uid = ?");
                binds.push(inputs.product_uid);
            }
            if (inputs.supplier_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "pu.supplier_uid = ?");
                binds.push(inputs.supplier_uid);
            }

            let orderBy = "ORDER BY pi.created_at DESC";
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                const col = sortable[selector];
                if (col) orderBy = `ORDER BY ${ col } ${ desc ? "DESC" : "ASC" }`;
            }

            const query = [selectItem, ...conditions, orderBy, limit, offset].join(" ");
            const prepare = database.prepare(query);
            const result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();
            const data = (result.results as any[]).map(parseRow);

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = [`SELECT COUNT(*) as count`, itemsFrom, ...conditions].join(" ");
                const countPrepare = database.prepare(countQuery);
                countResult = binds.length
                    ? await countPrepare.bind(...binds).first() as { count: number }
                    : await countPrepare.first() as { count: number };
            }

            return Responses.service.handler.success({
                data: data as ItemType[],
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
                UPDATE purchase_items
                SET product_uid = ?, price = ?, quantity = ?, note = ?
                WHERE uid = ?
            `).bind(body.product_uid, body.price, body.quantity, body.note || null, body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async delete(uid: ItemType["uid"]) {
        try {
            const result = await database.prepare("DELETE FROM purchase_items WHERE uid = ?").bind(uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}
