import Schema from './schema';
import database from '../../../database'
import Responses from '../../../utils/response';
import type { SuccessServiceResponse } from '../../../utils/response/type';
import type { DataGridResponse } from '../../../utils/devextreme/datagrid/type';
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
            
            const query: string[] = [`SELECT * FROM ${tableName}`];
            let filter: string;
            let orderBy: string;
            let result;

            if (inputs.searchText) {
                inputs.searchText = inputs.searchText.replace(/"/g, "").toLowerCase();
                if (inputs.searchText) {
                    inputs.searchText = `%${ inputs.searchText }%`;
                    filter = `WHERE search_vector LIKE ?`;
                    query.push(filter);
                }
            }
            
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                orderBy = `ORDER BY ${ selector } ${ desc ? "DESC" : "ASC" }`;
                query.push(orderBy);
            }
            
            query.push(limit);
            query.push(offset);
            
            // console.log(query.join(" "));
            const prepare = database.prepare(query.join(" "));
            result = inputs.searchText ? await prepare.bind(inputs.searchText).run() : await prepare.run();

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, filter!].join(" ")).bind(inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).first() as { count: number };
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