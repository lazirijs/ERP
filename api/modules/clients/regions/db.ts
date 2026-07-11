import Schema from './schema';
import database from '../../../database'
import Responses from '../../../utils/response';
import type { SuccessServiceResponse } from '../../../utils/response/type';
import type { DataGridResponse } from '../../../utils/devextreme/datagrid/type';
import { buildDataGridSQLiteConditions } from '../../../utils/devextreme/datagrid/service';
import type { RegionType, RegionCreateBodyType, RegionGetAllQueryType } from './type';

export default {
    async create(input: RegionCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("INSERT INTO regions (name, client_uid) VALUES (?, ?)").bind(input.name, input.client_uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: RegionType["uid"]): Promise<SuccessServiceResponse<RegionType>> {
        try {
            const result = await database.prepare("SELECT * FROM regions WHERE uid = ?").bind(uid).first();
            if (!result) throw Responses.service.handler.error("Region not found", 404);
            return Responses.service.handler.success(result as RegionType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: RegionGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<RegionType>>> {
        try {
            const tableName = "regions";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);
            
            const from = `FROM ${ tableName }`;

            const query: string[] = [`SELECT * ${ from }`];
            let orderBy: string;
            let result;

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    name: { searchText: 'name', values: 'name' }
                }
            });

            query.push(...conditions);

            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                orderBy = `ORDER BY ${ selector } ${ desc ? "DESC" : "ASC" }`;
                query.push(orderBy);
            }

            query.push(limit);
            query.push(offset);

            const prepare = database.prepare(query.join(" "));
            result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = [`SELECT COUNT(*) as count ${ from }`, ...conditions].join(" ");
                const prepareCount = database.prepare(countQuery);
                countResult = binds.length ? await prepareCount.bind(...binds).first() as { count: number } : await prepareCount.first() as { count: number };
            }

            // console.log(countResult);

            return Responses.service.handler.success({
                data: result.results as RegionType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<RegionType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
}