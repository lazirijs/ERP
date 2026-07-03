import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { DataGridResponse } from '../../utils/devextreme/datagrid/type';
import type { ProjectType, ProjectCreateBodyType, ProjectGetAllQueryType } from './type';

export default {
    async create(inputs: ProjectCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database
            .prepare("INSERT INTO projects (name, client_uid, region_uid, category_uid, status, offer, competitor_name, competitor_offer, guarantee_amount, note, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(inputs.name, inputs.client_uid, inputs.region_uid, inputs.category_uid, inputs.status, inputs.offer, inputs.competitor_name, inputs.competitor_offer, inputs.guarantee_amount, inputs.note || null, inputs.description || null)
            .run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: ProjectType["uid"]): Promise<SuccessServiceResponse<ProjectType>> {
        try {
            const result = await database.prepare(`
                SELECT 
                    p.*,
                    json_object('uid', c.uid, 'name', c.name, 'created_at', c.created_at) as client,
                    json_object('uid', r.uid, 'name', r.name, 'created_at', r.created_at) as region,
                    json_object('uid', cat.uid, 'parent_uid', cat.parent_uid, 'name', cat.name, 'created_at', cat.created_at) as category
                FROM projects p
                LEFT JOIN clients c ON p.client_uid = c.uid
                LEFT JOIN regions r ON p.region_uid = r.uid
                LEFT JOIN categories cat ON p.category_uid = cat.uid
                WHERE p.uid = ?
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Project not found", 404);
            result.client = JSON.parse(result.client as string);
            result.region = JSON.parse(result.region as string);
            result.category = JSON.parse(result.category as string);
            return Responses.service.handler.success(result as ProjectType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: ProjectGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<ProjectType>>> {
        try {
            const tableName = "projects";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`
                SELECT 
                    p.*,
                    json_object('uid', c.uid, 'name', c.name, 'created_at', c.created_at) as client,
                    json_object('uid', r.uid, 'name', r.name, 'created_at', r.created_at) as region,
                    json_object('uid', cat.uid, 'parent_uid', cat.parent_uid, 'name', cat.name, 'created_at', cat.created_at) as category
                FROM ${ tableName } p
                LEFT JOIN clients c ON p.client_uid = c.uid
                LEFT JOIN regions r ON p.region_uid = r.uid
                LEFT JOIN categories cat ON p.category_uid = cat.uid
            `];
            let filter: string = "";
            let orderBy: string = "";
            let result;

            if (inputs.searchText) {
                inputs.searchText = inputs.searchText.replace(/"/g, "").toLowerCase();
                if (inputs.searchText) {
                    inputs.searchText = `%${ inputs.searchText }%`;
                    filter = `WHERE search_vector LIKE ?`;
                }
            }

            if (inputs.client_uid) {
                if (filter) filter += ` AND p.client_uid = ${ inputs.client_uid }`;
                else filter = `WHERE p.client_uid = ${ inputs.client_uid }`;
                query.push(filter);
            } else query.push(filter);
            
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

            // parse result
            result.results = result.results.map((project: any) => {
                return {
                    ...project,
                    client: JSON.parse(project.client),
                    region: JSON.parse(project.region),
                    category: JSON.parse(project.category)
                };
            });

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM ${ tableName }`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, filter!].join(" ")).bind(inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).first() as { count: number };
            }

            // console.log(countResult);

            return Responses.service.handler.success({
                data: result.results as ProjectType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<ProjectType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
}