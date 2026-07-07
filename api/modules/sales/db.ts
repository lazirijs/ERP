import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { SaleType, SaleCreateBodyType, SaleUpdateBodyType } from './type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';

const parseRow = (row: any) => ({
    ...row,
    project: row.project ? JSON.parse(row.project) : null,
    client: row.client ? JSON.parse(row.client) : null
});

const selectSale = `
    SELECT
        s.*,
        COALESCE(SUM(si.price * si.quantity), 0) AS total_amount,
        COUNT(si.uid) AS items_count,
        CASE WHEN pr.uid IS NOT NULL THEN json_object('uid', pr.uid, 'name', pr.name) ELSE NULL END AS project,
        CASE WHEN c.uid IS NOT NULL THEN json_object('uid', c.uid, 'name', c.name) ELSE NULL END AS client
    FROM sales s
    LEFT JOIN projects pr ON s.project_uid = pr.uid
    LEFT JOIN clients c ON s.client_uid = c.uid
    LEFT JOIN sale_items si ON si.sale_uid = s.uid
`;

export default {
    async create(input: SaleCreateBodyType): Promise<SuccessServiceResponse<{ uid: string }>> {
        try {
            const result = await database
                .prepare("INSERT INTO sales (name, project_uid, client_uid, note) VALUES (?, ?, ?, ?) RETURNING uid")
                .bind(input.name ?? '', input.project_uid ?? null, input.client_uid ?? null, input.note ?? '')
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

    async getAll(inputs: DataGridQuery): Promise<SuccessServiceResponse<DataGridResponse<SaleType>>> {
        try {
            const tableName = "sales";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);

            const query: string[] = [selectSale];
            let filter: string;
            let orderBy: string;
            let result;

            if (inputs.searchText) {
                inputs.searchText = `%${ inputs.searchText }%`;
                filter = `WHERE s.name LIKE ?`;
                query.push(filter);
            }

            query.push("GROUP BY s.uid");

            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                const sortCol = ["total_amount", "items_count"].includes(selector) ? selector : `s.${ selector }`;
                orderBy = `ORDER BY ${ sortCol } ${ desc ? "DESC" : "ASC" }`;
                query.push(orderBy);
            }

            query.push(limit);
            query.push(offset);

            const prepare = database.prepare(query.join(" "));
            result = inputs.searchText ? await prepare.bind(inputs.searchText).run() : await prepare.run();
            result.results = (result.results as any[]).map(parseRow);

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM ${ tableName } s`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, `WHERE s.name LIKE ?`].join(" ")).bind(inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).first() as { count: number };
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
            `).bind(body.name ?? '', body.project_uid ?? null, body.client_uid ?? null, body.status, body.note ?? '', body.uid).run();
            return Responses.service.handler.success(result);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}
