import Schema from './schema'
import database from '../../database'
import storage from '../../storage'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { EmployeeType, EmployeeCreateBodyType, EmployeeGetAllQueryType, EmployeeUpdateBodyType } from './type';
import type { DataGridResponse } from '../../utils/devextreme/datagrid/type';

export default {
    async create(input: EmployeeCreateBodyType): Promise<SuccessServiceResponse<{ uid: string }>> {
        try {
            const result = await database
                .prepare("INSERT INTO employees (name, status, team_uid) VALUES (?, ?, ?) RETURNING uid")
                .bind(input.name, input.status, input.team_uid || null)
                .first<{ uid: string }>();
            return Responses.service.handler.success(result!);
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: EmployeeType["uid"]): Promise<SuccessServiceResponse<EmployeeType>> {
        try {
            // join: employee
            const result = await database.prepare(`
                SELECT 
                    employees.*,
                    CASE WHEN employees.team_uid IS NOT NULL
                        THEN json_object('uid', teams.uid, 'name', teams.name) 
                        ELSE NULL 
                    END as team
                FROM employees
                LEFT JOIN teams ON employees.team_uid = teams.uid
                WHERE employees.uid = ?
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Employee not found", 404);
            if (result.team) result.team = JSON.parse(result.team as string);
            return Responses.service.handler.success(result as EmployeeType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: EmployeeGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<EmployeeType>>> {
        try {
            const tableName = "employees";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`
                SELECT 
                    employees.*,
                    CASE WHEN employees.team_uid IS NOT NULL
                        THEN json_object('uid', teams.uid, 'name', teams.name) 
                        ELSE NULL 
                    END as team
                FROM ${ tableName }
                LEFT JOIN teams ON employees.team_uid = teams.uid
            `];
            let filter: string = inputs.team_uid === "null" ? "WHERE employees.team_uid IS NULL" : "";
            let groupBy: string = "GROUP BY employees.uid";
            let orderBy: string = "";
            let result;

            if (inputs.searchText) {
                inputs.searchText = `%${ inputs.searchText }%`;
                if (filter) filter += ` AND employees.name LIKE ?`;
                else filter = `WHERE employees.name LIKE ?`;
            }

            const team_uid = inputs.team_uid && inputs.team_uid != "null" && inputs.team_uid.replace(/"/g, "");

            if (team_uid) {
                if (filter) filter += ` AND employees.team_uid = ?`;
                else filter = `WHERE employees.team_uid = ?`;
            }
            
            query.push(filter);
            query.push(groupBy);
            
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if(!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                orderBy = `ORDER BY ${ selector } ${ desc ? "DESC" : "ASC" }`;
                query.push(orderBy);
            }
            
            query.push(limit);
            query.push(offset);
            
            const prepare = database.prepare(query.join(" "));
            if (inputs.searchText && team_uid) {
                result = await prepare.bind(inputs.searchText, team_uid).run();
            } else if (team_uid || inputs.searchText) {
                result = await prepare.bind(team_uid || inputs.searchText).run();
            } else {
                result = await prepare.run();
            }

            result.results = result.results.map((employee: any) => {
                if (employee.team) employee.team = JSON.parse(employee.team);
                return employee;
            });

            let countResult = { count: -1 };
            if(inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM ${tableName} ${filter}`;
                const prepareCount = database.prepare(countQuery);
                if (team_uid && inputs.searchText) {
                    countResult = await prepareCount.bind(team_uid, inputs.searchText).first() as { count: number };
                } else if (team_uid || inputs.searchText) {
                    countResult = await prepareCount.bind(team_uid || inputs.searchText).first() as { count: number };
                }
                else countResult = await prepareCount.first() as { count: number };
            }

            // console.log(countResult);

            return Responses.service.handler.success({
                data: result.results as EmployeeType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<EmployeeType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(input: EmployeeUpdateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("UPDATE employees SET name = ?, status = ?, team_uid = ? WHERE uid = ?").bind(input.name, input.status, input.team_uid || null, input.uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },

    async getDocuments(uid: EmployeeType["uid"]): Promise<SuccessServiceResponse<R2Object[]>> {
        try {
            // `include` is required for R2 list() to return customMetadata (original file name)
            const { objects } = await storage.list({ prefix: `employees/${ uid }/`, include: ["customMetadata", "httpMetadata"] });
            return Responses.service.handler.success(objects);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    // `primary` marks the uploaded file as the employee's profile picture (employees.image).
    // The profile picture is only ever set via the create/edit dialog (primary=true); documents
    // uploaded from the documents tab are regular files (primary=false).
    async uploadDocument({ uid, file, primary }: { uid: EmployeeType["uid"]; file: File; primary?: boolean }): Promise<SuccessServiceResponse<{ document: string }>> {
        try {
            const extension = file.name.split(".").pop() || "bin";
            const key = `employees/${ uid }/${ crypto.randomUUID() }.${ extension }`;
            await storage.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type }, customMetadata: { fileName: file.name } });

            if (primary) await database.prepare("UPDATE employees SET image = ? WHERE uid = ?").bind(key, uid).run();

            return Responses.service.handler.success({ document: key });
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async deleteDocument({ uid, document }: { uid: EmployeeType["uid"]; document: string }): Promise<SuccessServiceResponse<undefined>> {
        try {
            if (!document.startsWith(`employees/${ uid }/`)) throw Responses.service.handler.error("Document does not belong to this employee", 400);

            await storage.delete(document);

            // If the deleted file was the profile picture, clear it
            const employee = await database.prepare("SELECT image FROM employees WHERE uid = ?").bind(uid).first<{ image: string | null }>();
            if (employee && employee.image === document) {
                await database.prepare("UPDATE employees SET image = NULL WHERE uid = ?").bind(uid).run();
            }

            return Responses.service.handler.success();
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}