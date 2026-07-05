import Schema from './schema'
import database from '../../database'
import storage from '../../storage'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { PurchaseType, PurchaseCreateBodyType, PurchaseUpdateBodyType, PurchaseBatchBodyType } from './type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';

const parseSupplier = (row: any) => ({ ...row, supplier: row.supplier ? JSON.parse(row.supplier) : null });

export default {
    async create(input: PurchaseCreateBodyType): Promise<SuccessServiceResponse<{ uid: string }>> {
        try {
            const result = await database
                .prepare("INSERT INTO purchases (name, supplier_uid, note) VALUES (?, ?, ?) RETURNING uid")
                .bind(input.name, input.supplier_uid ?? null, input.note ?? '')
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
                for (const row of groupRows) {
                    await database
                        .prepare("INSERT INTO purchase_items (purchase_uid, product_uid, price, quantity, note) VALUES (?, ?, ?, ?, ?)")
                        .bind(purchase!.uid, row.product_uid, row.price, row.quantity, row.note ?? '')
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
                    COALESCE(SUM(pi.price * pi.quantity), 0) AS total_amount,
                    COUNT(pi.uid) AS items_count,
                    CASE WHEN s.uid IS NOT NULL THEN json_object('uid', s.uid, 'name', s.name) ELSE NULL END AS supplier
                FROM purchases p
                LEFT JOIN suppliers s ON p.supplier_uid = s.uid
                LEFT JOIN purchase_items pi ON pi.purchase_uid = p.uid
                WHERE p.uid = ?
                GROUP BY p.uid
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Purchase not found", 404);
            return Responses.service.handler.success(parseSupplier(result) as PurchaseType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getAll(inputs: DataGridQuery): Promise<SuccessServiceResponse<DataGridResponse<PurchaseType>>> {
        try {
            const tableName = "purchases";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);

            const query: string[] = [`
                SELECT
                    p.*,
                    COALESCE(SUM(pi.price * pi.quantity), 0) AS total_amount,
                    COUNT(pi.uid) AS items_count,
                    CASE WHEN s.uid IS NOT NULL THEN json_object('uid', s.uid, 'name', s.name) ELSE NULL END AS supplier
                FROM purchases p
                LEFT JOIN suppliers s ON p.supplier_uid = s.uid
                LEFT JOIN purchase_items pi ON pi.purchase_uid = p.uid
            `];
            let filter: string;
            let orderBy: string;
            let result;

            if (inputs.searchText) {
                inputs.searchText = `%${ inputs.searchText }%`;
                filter = `WHERE p.name LIKE ?`;
                query.push(filter);
            }

            query.push("GROUP BY p.uid");

            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                const sortCol = ["total_amount", "items_count"].includes(selector) ? selector : `p.${ selector }`;
                orderBy = `ORDER BY ${ sortCol } ${ desc ? "DESC" : "ASC" }`;
                query.push(orderBy);
            }

            query.push(limit);
            query.push(offset);

            const prepare = database.prepare(query.join(" "));
            result = inputs.searchText ? await prepare.bind(inputs.searchText).run() : await prepare.run();
            result.results = (result.results as any[]).map(parseSupplier);

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM ${ tableName } p`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, `WHERE p.name LIKE ?`].join(" ")).bind(inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).first() as { count: number };
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
            `).bind(body.name, body.supplier_uid ?? null, body.note ?? '', body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getDocuments(uid: PurchaseType["uid"]): Promise<SuccessServiceResponse<string[]>> {
        try {
            const { objects } = await storage.list({ prefix: `purchases/${ uid }/` });
            return Responses.service.handler.success(objects.map(object => object.key));
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async uploadDocument({ uid, file }: { uid: PurchaseType["uid"]; file: File }): Promise<SuccessServiceResponse<{ document: string }>> {
        try {
            const extension = file.name.split(".").pop() || "bin";
            const key = `purchases/${ uid }/${ crypto.randomUUID() }.${ extension }`;
            await storage.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
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
