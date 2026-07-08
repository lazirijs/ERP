import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { SaleType, SaleCreateBodyType, SaleUpdateBodyType, SaleGetAllQueryType } from './type';
import type { DataGridResponse } from '../../utils/devextreme/datagrid/type';

const parseRow = (row: any) => ({
    ...row,
    project: row.project ? JSON.parse(row.project) : null,
    client: row.client ? JSON.parse(row.client) : null
});

const selectSale = `
    SELECT
        s.*,
        s.total_amount,
        s.items_count,
        CASE WHEN pr.uid IS NOT NULL THEN json_object('uid', pr.uid, 'name', pr.name) ELSE NULL END AS project,
        CASE WHEN c.uid IS NOT NULL THEN json_object('uid', c.uid, 'name', c.name) ELSE NULL END AS client
    FROM sales s
    LEFT JOIN projects pr ON s.project_uid = pr.uid
    LEFT JOIN clients c ON s.client_uid = c.uid
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

    async getAll(inputs: SaleGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<SaleType>>> {
        try {
            const limit = "LIMIT " + inputs.take;
            const offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);

            const conditions: string[] = [];
            const binds: unknown[] = [];

            if (inputs.project_uid) {
                conditions.push("s.project_uid = ?");
                binds.push(inputs.project_uid);
            }
            if (inputs.searchText) {
                conditions.push("s.name LIKE ?");
                binds.push(`%${ inputs.searchText }%`);
            }
            const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

            let orderBy = "";
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                const sortCol = ["total_amount", "items_count"].includes(selector) ? selector : `s.${ selector }`;
                orderBy = `ORDER BY ${ sortCol } ${ desc ? "DESC" : "ASC" }`;
            }

            const query = [selectSale, where, "GROUP BY s.uid", orderBy, limit, offset].join(" ");
            const prepare = database.prepare(query);
            const result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();
            result.results = (result.results as any[]).map(parseRow);

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = [`SELECT COUNT(*) as count FROM sales s`, where].join(" ");
                countResult = binds.length
                    ? await database.prepare(countQuery).bind(...binds).first() as { count: number }
                    : await database.prepare(countQuery).first() as { count: number };
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
