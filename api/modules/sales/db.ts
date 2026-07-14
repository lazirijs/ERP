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
