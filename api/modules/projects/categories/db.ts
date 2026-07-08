import Schema from './schema'
import database from '../../../database'
import type { DataGridQuery, DataGridResponse } from '../../../utils/devextreme/datagrid/type';
import Responses from '../../../utils/response';
import type { SuccessServiceResponse } from '../../../utils/response/type';
import type { CategoryType, CategoryCreateBodyType } from './type';

export default {
    async create(input: CategoryCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("INSERT INTO categories (name, parent_uid) VALUES (?, ?)").bind(input.name, input.parent_uid || null).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: CategoryType["uid"]): Promise<SuccessServiceResponse<CategoryType>> {
        try {
            const result = await database.prepare("SELECT * FROM categories WHERE uid = ?").bind(uid).first();
            if (!result) throw Responses.service.handler.error("Category not found", 404);
            return Responses.service.handler.success(result as CategoryType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: DataGridQuery): Promise<SuccessServiceResponse<DataGridResponse<CategoryType>>> {
        try {
            const tableName = "categories";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`SELECT * FROM ${tableName}`];
            let filter: string;
            let orderBy: string = "parent_uid ASC";
            let result;

            if (inputs.searchText) {
                inputs.searchText = `%${ inputs.searchText }%`;
                filter = `WHERE name LIKE ?`;
                query.push(filter);
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
                data: result.results as CategoryType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<CategoryType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
}