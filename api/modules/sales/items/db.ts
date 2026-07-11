import database from '../../../database'
import Responses from '../../../utils/response';
import type { SuccessServiceResponse } from '../../../utils/response/type';
import type { DataGridResponse } from '../../../utils/devextreme/datagrid/type';
import type { ItemType, ItemCreateBodyType, ItemUpdateBodyType, ItemBatchBodyType, ItemGetAllQueryType } from './type';
import { buildDataGridSQLiteConditions } from '../../../utils/devextreme/datagrid/service';

const parseRow = (row: any) => ({
    ...row,
    product: row.product ? JSON.parse(row.product) : null,
    sale: row.sale ? JSON.parse(row.sale) : null
});

const itemsFrom = `
    FROM sale_items si
    LEFT JOIN products pr ON si.product_uid = pr.uid
    LEFT JOIN sales s ON si.sale_uid = s.uid
`;

const selectItem = `
    SELECT
        si.*,
        (si.price * si.quantity) AS total,
        json_object('uid', pr.uid, 'name', pr.name, 'image', pr.image) AS product,
        json_object('uid', s.uid, 'name', s.name, 'status', s.status) AS sale
    ${ itemsFrom }
`;

const sortable: Record<string, string> = {
    price: "si.price",
    quantity: "si.quantity",
    total: "total",
    note: "si.note",
    created_at: "si.created_at"
};

// Ensure the product has enough stock. `addBack` re-adds the quantity a sale item
// already reserves (when editing that same item's product) before comparing.
const checkStock = async (product_uid: string, requested: number, addBack: number = 0) => {
    const product = await database
        .prepare("SELECT quantity, name FROM products WHERE uid = ?")
        .bind(product_uid)
        .first<{ quantity: number; name: string }>();
    const remaining = product?.quantity ?? 0;
    if (requested > remaining + addBack) {
        throw Responses.service.handler.error({ message: `Not enough stock for "${ product?.name ?? '' }". Remaining: ${ remaining }`, remaining }, 400);
    }
};

export default {
    async create(input: ItemCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await checkStock(input.product_uid, input.quantity);
            await database
                .prepare("INSERT INTO sale_items (sale_uid, product_uid, price, quantity, note) VALUES (?, ?, ?, ?, ?)")
                .bind(input.sale_uid, input.product_uid, input.price, input.quantity, input.note ?? '')
                .run();
            return Responses.service.handler.success();
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async createBatch({ sale_uid, rows }: ItemBatchBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            // Aggregate requested quantity per product, then verify stock before inserting anything
            const requested = new Map<string, number>();
            for (const row of rows) requested.set(row.product_uid, (requested.get(row.product_uid) ?? 0) + row.quantity);
            for (const [product_uid, quantity] of requested) await checkStock(product_uid, quantity);

            for (const row of rows) {
                await database
                    .prepare("INSERT INTO sale_items (sale_uid, product_uid, price, quantity, note) VALUES (?, ?, ?, ?, ?)")
                    .bind(sale_uid, row.product_uid, row.price, row.quantity, row.note ?? '')
                    .run();
            }
            return Responses.service.handler.success();
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getByUid(uid: ItemType["uid"]): Promise<SuccessServiceResponse<ItemType>> {
        try {
            const result = await database.prepare(`${ selectItem } WHERE si.uid = ?`).bind(uid).first();
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
                    'product.name': { searchText: 'pr.name', values: 'si.product_uid' },
                    'sale.name': { searchText: 's.name', values: 'si.sale_uid' },
                    'sale.status': { searchText: 's.status', values: 's.status' },
                    note: { searchText: 'si.note', values: 'si.note' },
                    price: { searchText: 'si.price', values: 'si.price' },
                    quantity: { searchText: 'si.quantity', values: 'si.quantity' },
                    // total: { searchText: 'si.total', values: 'si.total' }, // no such column si.total
                    created_at: { searchText: 'si.created_at', values: 'si.created_at' }
                }
            });

            console.log({ conditions, binds });

            if (inputs.sale_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "si.sale_uid = ?");
                binds.push(inputs.sale_uid);
            }
            if (inputs.product_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "si.product_uid = ?");
                binds.push(inputs.product_uid);
            }
            if (inputs.project_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "s.project_uid = ?");
                binds.push(inputs.project_uid);
            }

            let orderBy = "ORDER BY si.created_at DESC";
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
            const current = await database
                .prepare("SELECT product_uid, quantity FROM sale_items WHERE uid = ?")
                .bind(body.uid)
                .first<{ product_uid: string; quantity: number }>();
            // If the product is unchanged, this item's current reservation is available to it again
            const addBack = current && current.product_uid === body.product_uid ? current.quantity : 0;
            await checkStock(body.product_uid, body.quantity, addBack);

            const result = await database.prepare(`
                UPDATE sale_items
                SET product_uid = ?, price = ?, quantity = ?, note = ?
                WHERE uid = ?
            `).bind(body.product_uid, body.price, body.quantity, body.note ?? '', body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async delete(uid: ItemType["uid"]) {
        try {
            const result = await database.prepare("DELETE FROM sale_items WHERE uid = ?").bind(uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}
