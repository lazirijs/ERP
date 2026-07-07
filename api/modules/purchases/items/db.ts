import database from '../../../database'
import Responses from '../../../utils/response';
import type { SuccessServiceResponse } from '../../../utils/response/type';
import type { DataGridResponse } from '../../../utils/devextreme/datagrid/type';
import type { ItemType, ItemCreateBodyType, ItemUpdateBodyType, ItemBatchBodyType, ItemGetAllQueryType } from './type';

const parseRow = (row: any) => ({
    ...row,
    product: row.product ? JSON.parse(row.product) : null,
    purchase: row.purchase ? JSON.parse(row.purchase) : null,
    supplier: row.supplier ? JSON.parse(row.supplier) : null
});

const selectItem = `
    SELECT
        pi.*,
        (pi.price * pi.quantity) AS total,
        json_object('uid', pr.uid, 'name', pr.name, 'image', pr.image) AS product,
        json_object('uid', pu.uid, 'name', pu.name) AS purchase,
        CASE WHEN s.uid IS NOT NULL THEN json_object('uid', s.uid, 'name', s.name) ELSE NULL END AS supplier
    FROM purchase_items pi
    LEFT JOIN products pr ON pi.product_uid = pr.uid
    LEFT JOIN purchases pu ON pi.purchase_uid = pu.uid
    LEFT JOIN suppliers s ON pu.supplier_uid = s.uid
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
                .bind(input.purchase_uid, input.product_uid, input.price, input.quantity, input.note ?? '')
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
                    .bind(purchase_uid, row.product_uid, row.price, row.quantity, row.note ?? '')
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

            const conditions: string[] = [];
            const binds: unknown[] = [];

            if (inputs.purchase_uid) {
                conditions.push("pi.purchase_uid = ?");
                binds.push(inputs.purchase_uid);
            }
            if (inputs.product_uid) {
                conditions.push("pi.product_uid = ?");
                binds.push(inputs.product_uid);
            }
            if (inputs.searchText) {
                conditions.push("pr.name LIKE ?");
                binds.push(`%${ inputs.searchText }%`);
            }
            const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

            let orderBy = "ORDER BY pi.created_at DESC";
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                const col = sortable[selector];
                if (col) orderBy = `ORDER BY ${ col } ${ desc ? "DESC" : "ASC" }`;
            }

            const query = [selectItem, where, orderBy, limit, offset].join(" ");
            const result = binds.length
                ? await database.prepare(query).bind(...binds).run()
                : await database.prepare(query).run();
            const data = (result.results as any[]).map(parseRow);

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM purchase_items pi LEFT JOIN products pr ON pi.product_uid = pr.uid ${ where }`;
                countResult = binds.length
                    ? await database.prepare(countQuery).bind(...binds).first() as { count: number }
                    : await database.prepare(countQuery).first() as { count: number };
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
            `).bind(body.product_uid, body.price, body.quantity, body.note ?? '', body.uid).run();
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
