import Schema from './schema'
import database from '../../database'
import storage from '../../storage'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { PurchaseType, PurchaseCreateBodyType, PurchaseUpdateBodyType, PurchaseBatchBodyType, PurchaseGetAllQueryType } from './type';
import type { DataGridResponse } from '../../utils/devextreme/datagrid/type';
import { buildDataGridSQLiteConditions } from '../../utils/devextreme/datagrid/service';

const parseSupplier = (row: any) => ({ ...row, supplier: row.supplier ? JSON.parse(row.supplier) : null });

export default {
    async create(input: PurchaseCreateBodyType): Promise<SuccessServiceResponse<{ uid: string }>> {
        try {
            const result = await database
                .prepare("INSERT INTO purchases (name, supplier_uid, note) VALUES (?, ?, ?) RETURNING uid")
                .bind(input.name, input.supplier_uid || null, input.note || null)
                .first<{ uid: string }>();
            return Responses.service.handler.success(result!);
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async createBatch({ rows }: PurchaseBatchBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            // Group rows by supplier (null supplier grouped under "")
            const groups = new Map<string, typeof rows>();
            for (const row of rows) {
                const key = row.supplier_uid ?? "";
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(row);
            }

            // Resolve supplier names for naming the purchases
            const supplierUids = [...groups.keys()].filter(Boolean);
            const supplierNames = new Map<string, string>();
            if (supplierUids.length) {
                const placeholders = supplierUids.map(() => "?").join(",");
                const res = await database.prepare(`SELECT uid, name FROM suppliers WHERE uid IN (${ placeholders })`).bind(...supplierUids).all<{ uid: string; name: string }>();
                for (const s of res.results) supplierNames.set(s.uid, s.name);
            }

            const date = new Date().toISOString().slice(0, 10);
            for (const [supplierKey, groupRows] of groups) {
                const supplierUid = supplierKey || null;
                const supplierName = supplierUid ? supplierNames.get(supplierUid) : null;
                const name = supplierName ? `${ supplierName } — ${ date }` : `No supplier — ${ date }`;
                const purchase = await database
                    .prepare("INSERT INTO purchases (name, supplier_uid, note) VALUES (?, ?, ?) RETURNING uid")
                    .bind(name, supplierUid, '')
                    .first<{ uid: string }>();
                if (!purchase?.uid) throw Responses.service.handler.error("Failed to create purchase", 500);
                for (const row of groupRows) {
                    await database
                        .prepare("INSERT INTO purchase_items (purchase_uid, product_uid, price, quantity, note) VALUES (?, ?, ?, ?, ?)")
                        .bind(purchase.uid, row.product_uid, row.price, row.quantity, row.note || null)
                        .run();
                }
            }
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async getByUid(uid: PurchaseType["uid"]): Promise<SuccessServiceResponse<PurchaseType>> {
        try {
            const result = await database.prepare(`
                SELECT
                    p.*,
                    p.total_amount,
                    p.items_count,
                    CASE WHEN p.supplier_uid IS NOT NULL THEN json_object('uid', s.uid, 'name', s.name) END AS supplier
                FROM purchases p
                LEFT JOIN suppliers s ON p.supplier_uid = s.uid
                WHERE p.uid = ?
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Purchase not found", 404);
            return Responses.service.handler.success(parseSupplier(result) as PurchaseType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getAll(inputs: PurchaseGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<PurchaseType>>> {
        try {
            const limit = "LIMIT " + inputs.take;
            const offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);

            const from = `
                FROM purchases p
                LEFT JOIN suppliers s ON p.supplier_uid = s.uid
            `;

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    name: { searchText: 'p.name', values: 'p.name' },
                    'supplier.name': { searchText: 's.name', values: 'p.supplier_uid' },
                    items_count: { searchText: 'p.items_count', values: 'p.items_count' },
                    total_amount: { searchText: 'p.total_amount', values: 'p.total_amount' },
                    total_amount_expensed: { searchText: 'p.total_amount_expensed', values: 'p.total_amount_expensed' },
                    note: { searchText: 'p.note', values: 'p.note' },
                    created_at: { searchText: 'p.created_at', values: 'p.created_at' }
                }
            });

            if (inputs.supplier_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "p.supplier_uid = ?");
                binds.push(inputs.supplier_uid);
            }

            let orderBy = "";
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                const sortCol = ["total_amount", "items_count"].includes(selector) ? selector : `p.${ selector }`;
                orderBy = `ORDER BY ${ sortCol } ${ desc ? "DESC" : "ASC" }`;
            }

            const query = [`
                SELECT
                    p.*,
                    p.total_amount,
                    p.items_count,
                    CASE WHEN p.supplier_uid IS NOT NULL THEN json_object('uid', s.uid, 'name', s.name) END AS supplier
                ${ from }
            `, ...conditions, orderBy, limit, offset].join(" ");

            const prepare = database.prepare(query);
            const result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();
            result.results = (result.results as any[]).map(parseSupplier);

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = ["SELECT COUNT(*) as count", from, ...conditions].join(" ");                
                const countPrepare = database.prepare(countQuery);
                countResult = binds.length
                    ? await countPrepare.bind(...binds).first() as { count: number }
                    : await countPrepare.first() as { count: number };
            }

            return Responses.service.handler.success({
                data: result.results as PurchaseType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<PurchaseType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(body: PurchaseUpdateBodyType) {
        try {
            const result = await database.prepare(`
                UPDATE purchases
                SET name = ?, supplier_uid = ?, note = ?
                WHERE uid = ?
            `).bind(body.name, body.supplier_uid || null, body.note || null, body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getDocuments(uid: PurchaseType["uid"]): Promise<SuccessServiceResponse<R2Object[]>> {
        try {
            const { objects } = await storage.list({ prefix: `purchases/${ uid }/` });
            return Responses.service.handler.success(objects);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async uploadDocument({ uid, file }: { uid: PurchaseType["uid"]; file: File }): Promise<SuccessServiceResponse<{ document: string }>> {
        try {
            const extension = file.name.split(".").pop() || "bin";
            const key = `purchases/${ uid }/${ crypto.randomUUID() }.${ extension }`;
            await storage.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type }, customMetadata: { fileName: file.name } });
            return Responses.service.handler.success({ document: key });
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async deleteDocument({ uid, document }: { uid: PurchaseType["uid"]; document: string }): Promise<SuccessServiceResponse<undefined>> {
        try {
            if (!document.startsWith(`purchases/${ uid }/`)) throw Responses.service.handler.error("Document does not belong to this purchase", 400);
            await storage.delete(document);
            return Responses.service.handler.success();
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}
