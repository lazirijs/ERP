import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { SupplierType, SupplierCreateBodyType, SupplierUpdateBodyType, SupplierGetAllQueryType } from './type';
import type { DataGridResponse } from '../../utils/devextreme/datagrid/type';
import { buildDataGridSQLiteConditions } from '../../utils/devextreme/datagrid/service';

export default {
    async create(input: SupplierCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database
                .prepare("INSERT INTO suppliers (name, description, contact, address) VALUES (?, ?, ?, ?)")
                .bind(input.name, input.description, input.contact, input.address)
                .run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async getByUid(uid: SupplierType["uid"]): Promise<SuccessServiceResponse<SupplierType>> {
        try {
            const result = await database.prepare(`
                SELECT * FROM suppliers
                WHERE uid = ?
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Supplier not found", 404);
            return Responses.service.handler.success(result as SupplierType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getAll(inputs: SupplierGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<SupplierType>>> {
        try {
            const limit = "LIMIT " + inputs.take;
            const offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);

            // When filtering by product, suppliers are reached indirectly through purchase
            // history, so switch to a joined + grouped query returning distinct suppliers.
            // Column references are qualified with the `s.` alias because `created_at`
            // is ambiguous across the joined tables.
            // suppliers is always aliased `s`, so column references stay `s.`-qualified in both branches.
            const byProduct = !!inputs.product_uid;
            const from = byProduct
                ? `FROM suppliers s
                   JOIN purchases p       ON p.supplier_uid = s.uid
                   JOIN purchase_items pi ON pi.purchase_uid = p.uid`
                : `FROM suppliers s`;
            const groupBy = byProduct ? "GROUP BY s.uid" : "";

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    name: { searchText: 's.name', values: 's.name' },
                    contact: { searchText: 's.contact', values: 's.contact' },
                    address: { searchText: 's.address', values: 's.address' },
                    created_at: { searchText: 's.created_at', values: 's.created_at' }
                },
                excludeColumnsFromSearchText: ['created_at']
            });

            if (inputs.product_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "pi.product_uid = ?");
                binds.push(inputs.product_uid);
            }

            let orderBy = `ORDER BY s.created_at DESC`;
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                orderBy = `ORDER BY s.${ selector } ${ desc ? "DESC" : "ASC" }`;
            }

            const query = [`SELECT s.*`, from, ...conditions, groupBy, orderBy, limit, offset].join(" ");
            const prepare = database.prepare(query);
            const result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countSelect = byProduct ? "COUNT(DISTINCT s.uid)" : "COUNT(*)";
                const countQuery = [`SELECT ${ countSelect } as count`, from, ...conditions].join(" ");                
                const countPrepare = database.prepare(countQuery);
                countResult = binds.length
                    ? await countPrepare.bind(...binds).first() as { count: number }
                    : await countPrepare.first() as { count: number };
            }

            return Responses.service.handler.success({
                data: result.results as SupplierType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<SupplierType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(body: SupplierUpdateBodyType) {
        try {
            const result = await database.prepare(`
                UPDATE suppliers
                SET name = ?, description = ?, contact = ?, address = ?
                WHERE uid = ?
            `).bind(body.name, body.description, body.contact, body.address, body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}
