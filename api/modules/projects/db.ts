import Schema from './schema'
import database from '../../database'
import storage from '../../storage'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { DataGridResponse } from '../../utils/devextreme/datagrid/type';
import { buildDataGridSQLiteConditions } from '../../utils/devextreme/datagrid/service';
import type { ProjectType, ProjectCreateBodyType, ProjectUpdateBodyType, ProjectGetAllQueryType } from './type';

export default {
    async create(inputs: ProjectCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database
            .prepare("INSERT INTO projects (name, client_uid, region_uid, category_uid, status, offer, note, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(inputs.name, inputs.client_uid, inputs.region_uid || null, inputs.category_uid || null, inputs.status, inputs.offer, inputs.note || null, inputs.description || null)
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
                    json_object('uid', c.uid, 'name', c.name, 'created_at', c.created_at) AS client,
                    CASE WHEN p.region_uid IS NOT NULL THEN json_object('uid', r.uid, 'name', r.name, 'created_at', r.created_at) END AS region,
                    CASE WHEN p.category_uid IS NOT NULL THEN json_object('uid', cat.uid, 'parent_uid', cat.parent_uid, 'name', cat.name, 'created_at', cat.created_at) END AS category
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
            
            const from = `
                FROM ${ tableName } p
                LEFT JOIN clients c ON p.client_uid = c.uid
                LEFT JOIN regions r ON p.region_uid = r.uid
                LEFT JOIN categories cat ON p.category_uid = cat.uid
            `;

            const query: string[] = [`
                SELECT
                    p.*,
                    json_object('uid', c.uid, 'name', c.name, 'created_at', c.created_at) AS client,
                    CASE WHEN p.region_uid IS NOT NULL THEN json_object('uid', r.uid, 'name', r.name, 'created_at', r.created_at) END AS region,
                    CASE WHEN p.category_uid IS NOT NULL THEN json_object('uid', cat.uid, 'parent_uid', cat.parent_uid, 'name', cat.name, 'created_at', cat.created_at) END AS category
                ${ from }
            `];
            let orderBy: string = "";
            let result;

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    name: { searchText: 'p.name', values: 'p.name' },
                    'client.name': { searchText: 'c.name', values: 'p.client_uid' },
                    // 'region.name': { searchText: 'r.name', values: 'p.region_uid' },
                    // 'category.name': { searchText: 'cat.name', values: 'p.category_uid' },
                    status: { searchText: 'p.status', values: 'p.status' },
                    offer: { searchText: 'p.offer', values: 'p.offer' },
                    total_amount_expensed: { searchText: 'p.total_amount_expensed', values: 'p.total_amount_expensed' },
                    total_amount_received: { searchText: 'p.total_amount_received', values: 'p.total_amount_received' },
                    total_amount_sold: { searchText: 'p.total_amount_sold', values: 'p.total_amount_sold' },
                    created_at: { searchText: 'p.created_at', values: 'p.created_at' }
                },
                excludeColumnsFromSearchText: [...(inputs.excludeColumnsFromSearchText || []), 'status']
            });

            if (inputs.client_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "p.client_uid = ?");
                binds.push(inputs.client_uid);
            }

            query.push(...conditions);

            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                orderBy = `ORDER BY p.${ selector } ${ desc ? "DESC" : "ASC" }`;
                query.push(orderBy);
            }

            query.push(limit);
            query.push(offset);

            const prepare = database.prepare(query.join(" "));
            result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();

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
                const countQuery = ["SELECT COUNT(*) as count", from, ...conditions].join(" ");
                const prepareCount = database.prepare(countQuery);
                countResult = binds.length ? await prepareCount.bind(...binds).first() as { count: number } : await prepareCount.first() as { count: number };
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

    async update(inputs: ProjectUpdateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database
                .prepare("UPDATE projects SET name = ?, client_uid = ?, region_uid = ?, category_uid = ?, status = ?, offer = ?, note = ?, description = ? WHERE uid = ?")
                .bind(inputs.name, inputs.client_uid, inputs.region_uid, inputs.category_uid, inputs.status, inputs.offer ?? 0, inputs.note || null, inputs.description || null, inputs.uid)
                .run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async getDocuments(uid: ProjectType["uid"]): Promise<SuccessServiceResponse<R2Object[]>> {
        try {
            // `include` is required for R2 list() to return customMetadata (original file name)
            const { objects } = await storage.list({ prefix: `projects/${ uid }/`, include: ["customMetadata", "httpMetadata"] });
            return Responses.service.handler.success(objects);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async uploadDocument({ uid, file }: { uid: ProjectType["uid"]; file: File }): Promise<SuccessServiceResponse<{ document: string }>> {
        try {
            const extension = file.name.split(".").pop() || "bin";
            const key = `projects/${ uid }/${ crypto.randomUUID() }.${ extension }`;
            await storage.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type }, customMetadata: { fileName: file.name } });
            return Responses.service.handler.success({ document: key });
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async deleteDocument({ uid, document }: { uid: ProjectType["uid"]; document: string }): Promise<SuccessServiceResponse<undefined>> {
        try {
            if (!document.startsWith(`projects/${ uid }/`)) throw Responses.service.handler.error("Document does not belong to this project", 400);
            await storage.delete(document);
            return Responses.service.handler.success();
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
}