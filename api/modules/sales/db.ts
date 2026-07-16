import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { SaleType, SaleCreateBodyType, SaleUpdateBodyType, SaleGetAllQueryType } from './type';
import type { DataGridResponse } from '../../utils/devextreme/datagrid/type';
import { buildDataGridSQLiteConditions } from '../../utils/devextreme/datagrid/service';

const parseRow = (row: any) => ({
    ...row,
    project: row.project ? JSON.parse(row.project) : null,
    client: row.client ? JSON.parse(row.client) : null
});

const salesFrom = `
    FROM sales s
    LEFT JOIN projects pr ON s.project_uid = pr.uid
    LEFT JOIN clients c ON s.client_uid = c.uid
`;

type LotCursor = { uid: string; remaining: number; price: number };

// Complete a sale: allocate each item's quantity across its product's purchase lots
// oldest-first (FIFO), freeze the per-unit cost onto sale_items.cost, advance
// purchase_items.sold_quantity, and flip the sale to status 1 — all in one atomic batch.
// Throws (before writing anything) if any product lacks enough un-consumed purchased stock.
const completeSale = async (body: SaleUpdateBodyType) => {
    // 1. Load this sale's lines together with their product names (for error messages)
    const items = (await database.prepare(`
        SELECT si.uid, si.product_uid, si.quantity, p.name AS product_name
        FROM sale_items si
        LEFT JOIN products p ON p.uid = si.product_uid
        WHERE si.sale_uid = ?
    `).bind(body.uid).all<{ uid: string; product_uid: string; quantity: number; product_name: string }>()).results;

    if (!items.length) throw Responses.service.handler.error({ message: "Cannot complete a sale with no items." }, 400);

    // 2. Total quantity needed per product across all lines of this sale
    const neededByProduct = new Map<string, { name: string; qty: number }>();
    for (const it of items) {
        const entry = neededByProduct.get(it.product_uid) ?? { name: it.product_name, qty: 0 };
        entry.qty += it.quantity;
        neededByProduct.set(it.product_uid, entry);
    }

    // 3. Load each product's lots oldest-first, verify FIFO capacity, and build in-memory cursors
    const lotsByProduct = new Map<string, LotCursor[]>();
    for (const [product_uid, { name, qty }] of neededByProduct) {
        const lots = (await database.prepare(`
            SELECT uid, quantity, sold_quantity, price
            FROM purchase_items
            WHERE product_uid = ?
            ORDER BY created_at ASC, uid ASC
        `).bind(product_uid).all<{ uid: string; quantity: number; sold_quantity: number; price: number }>()).results;

        const cursors: LotCursor[] = lots.map(l => ({ uid: l.uid, remaining: l.quantity - l.sold_quantity, price: l.price }));
        const capacity = cursors.reduce((sum, c) => sum + c.remaining, 0);
        if (qty > capacity) {
            throw Responses.service.handler.error({ message: `Not enough stock for "${ name }" to complete this sale. Available: ${ capacity }, needed: ${ qty }`, product_uid, available: capacity, needed: qty }, 400);
        }
        lotsByProduct.set(product_uid, cursors);
    }

    // 4. Allocate each line against its product's lots; accumulate per-unit cost and lot consumption
    const lotConsumed = new Map<string, number>(); // purchase_item.uid -> qty consumed by this sale
    const itemCost = new Map<string, number>();     // sale_item.uid -> per-unit COGS
    for (const it of items) {
        const cursors = lotsByProduct.get(it.product_uid)!;
        let toFill = it.quantity;
        let totalCost = 0;
        for (const lot of cursors) {
            if (toFill <= 0) break;
            const take = Math.min(lot.remaining, toFill);
            if (take <= 0) continue;
            lot.remaining -= take;
            toFill -= take;
            totalCost += take * lot.price;
            lotConsumed.set(lot.uid, (lotConsumed.get(lot.uid) ?? 0) + take);
        }
        itemCost.set(it.uid, it.quantity > 0 ? totalCost / it.quantity : 0);
    }

    // 5. Write everything atomically: advance lot cursors, freeze line costs, flip status
    const statements = [
        ...[...lotConsumed].map(([lot_uid, qty]) =>
            database.prepare("UPDATE purchase_items SET sold_quantity = sold_quantity + ? WHERE uid = ?").bind(qty, lot_uid)),
        ...[...itemCost].map(([item_uid, cost]) =>
            database.prepare("UPDATE sale_items SET cost = ? WHERE uid = ?").bind(cost, item_uid)),
        database.prepare("UPDATE sales SET name = ?, project_uid = ?, client_uid = ?, status = 1, note = ? WHERE uid = ?")
            .bind(body.name || null, body.project_uid || null, body.client_uid || null, body.note || null, body.uid)
    ];
    await database.batch(statements);
};

const selectSale = `
    SELECT
        s.*,
        CASE WHEN s.project_uid IS NOT NULL THEN json_object('uid', pr.uid, 'name', pr.name) END AS project,
        CASE WHEN s.client_uid IS NOT NULL THEN json_object('uid', c.uid, 'name', c.name, 'created_at', c.created_at) END AS client
    ${ salesFrom }
`;

export default {
    async create(input: SaleCreateBodyType): Promise<SuccessServiceResponse<{ uid: string }>> {
        try {
            const result = await database
                .prepare("INSERT INTO sales (name, project_uid, client_uid, note) VALUES (?, ?, ?, ?) RETURNING uid")
                .bind(input.name || '', input.project_uid || null, input.client_uid || null, input.note || null)
                .first<{ uid: string }>();
            return Responses.service.handler.success(result!);
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async getByUid(uid: SaleType["uid"]): Promise<SuccessServiceResponse<SaleType>> {
        try {
            const result = await database.prepare(`${ selectSale } WHERE s.uid = ? GROUP BY s.uid`).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Sale not found", 404);
            return Responses.service.handler.success(parseRow(result) as SaleType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getAll(inputs: SaleGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<SaleType>>> {
        try {
            const limit = "LIMIT " + inputs.take;
            const offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    name: { searchText: 's.name', values: 's.name' },
                    'project.name': { searchText: 'pr.name', values: 's.project_uid' },
                    'client.name': { searchText: 'c.name', values: 's.client_uid' },
                    status: { searchText: 's.status', values: 's.status' },
                    items_count: { searchText: 's.items_count', values: 's.items_count' },
                    total_amount: { searchText: 's.total_amount', values: 's.total_amount' },
                    total_amount_received: { searchText: 's.total_amount_received', values: 's.total_amount_received' },
                    total_amount_expensed: { searchText: 's.total_amount_expensed', values: 's.total_amount_expensed' },
                    created_at: { searchText: 's.created_at', values: 's.created_at' }
                },
                excludeColumnsFromSearchText: [...(inputs.excludeColumnsFromSearchText || []), 'status']
            });

            if (inputs.project_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "s.project_uid = ?");
                binds.push(inputs.project_uid);
            }

            let orderBy = "";
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                const sortCol = ["total_amount", "items_count"].includes(selector) ? selector : `s.${ selector }`;
                orderBy = `ORDER BY ${ sortCol } ${ desc ? "DESC" : "ASC" }`;
            }

            const query = [selectSale, ...conditions, "GROUP BY s.uid", orderBy, limit, offset].join(" ");
            const prepare = database.prepare(query);
            const result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();
            result.results = (result.results as any[]).map(parseRow);

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = [`SELECT COUNT(*) as count`, salesFrom, ...conditions].join(" ");                
                const countPrepare = database.prepare(countQuery);
                countResult = binds.length
                    ? await countPrepare.bind(...binds).first() as { count: number }
                    : await countPrepare.first() as { count: number };
            }

            return Responses.service.handler.success({
                data: result.results as SaleType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<SaleType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(body: SaleUpdateBodyType) {
        try {
            const current = await database.prepare("SELECT status FROM sales WHERE uid = ?").bind(body.uid).first<{ status: 0 | 1 }>();
            if (!current) throw Responses.service.handler.error({ message: "Sale not found" }, 404);

            // A completed sale is frozen: its cost of goods and stock allocation are already
            // committed. Info fields (name/project/client/note) may still be edited, but it can
            // never be reopened to pending.
            if (current.status === 1 && body.status === 0) {
                throw Responses.service.handler.error({ message: "A completed sale cannot be reopened." }, 400);
            }

            // Transition pending -> complete: run FIFO allocation, freeze costs, advance lots.
            if (current.status === 0 && body.status === 1) {
                await completeSale(body);
                return Responses.service.handler.success({ success: true });
            }

            // Staying pending, or editing info on an already-completed sale: plain update.
            const result = await database.prepare(`
                UPDATE sales
                SET name = ?, project_uid = ?, client_uid = ?, status = ?, note = ?
                WHERE uid = ?
            `).bind(body.name || null, body.project_uid || null, body.client_uid || null, body.status, body.note || null, body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}
