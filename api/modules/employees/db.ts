import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { EmployeeType, EmployeeCreateBodyType, EmployeeGetAllQueryType, EmployeeUpdateBodyType } from './type';
import type { DataGridResponse } from '../../utils/devextreme/datagrid/type';

export default {
    async create(input: EmployeeCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            await database.prepare("INSERT INTO employees (name, status, team_uid) VALUES (?, ?, ?)").bind(input.name, input.status, input.team_uid || null).run();
            return Responses.service.handler.success();
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
    }
}