import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { AttendanceDeleteRegisterBodyType, AttendanceRegisterBodyType, AttendanceRegisterType, AttendanceType, AttendanceUpdateRegisterBodyType, GetAllAttendanceRegistersQueryType } from './type';
import type { DataGridQuery, DataGridResponse } from '../../utils/devextreme/datagrid/type';

export default {
    async create(): Promise<SuccessServiceResponse<{ uid: string }>> {
        try {
            const result = await database.prepare("INSERT INTO attendances DEFAULT VALUES RETURNING uid").first();
            return Responses.service.handler.success({ uid: result?.uid as string });
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    },
    
    async getByUid(uid: AttendanceType["uid"]): Promise<SuccessServiceResponse<AttendanceType>> {
        try {
            // join: employee
            // count: total_present, total_absent
            const result = await database.prepare(`
                SELECT 
                    a.*,
                    SUM(CASE WHEN ar.status = 0 THEN 1 ELSE 0 END) AS total_present,
                    SUM(CASE WHEN ar.status = 1 THEN 1 ELSE 0 END) AS total_absent
                FROM attendances a
                LEFT JOIN attendance_registers ar ON ar.attendance_uid = a.uid
                WHERE a.uid = ?
                GROUP BY a.uid
            `).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Attendance not found", 404);
            return Responses.service.handler.success(result as AttendanceType);
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },
    
    async getAll(inputs: DataGridQuery): Promise<SuccessServiceResponse<DataGridResponse<AttendanceType>>> {
        try {
            const tableName = "attendances";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`
                SELECT 
                    *
                FROM ${ tableName }
            `];
            let filter: string;
            let orderBy: string;
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
                const countQuery = `SELECT COUNT(*) as count FROM ${ tableName }`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, filter!].join(" ")).bind(inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).first() as { count: number };
            }

            // console.log(countResult);

            return Responses.service.handler.success({
                data: result.results as AttendanceType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<AttendanceType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async register(inputs: AttendanceRegisterBodyType): Promise<SuccessServiceResponse<AttendanceRegisterType>> {        
        try {
            await database.prepare("INSERT INTO attendance_registers (attendance_uid, employee_uid, project_uid, status) VALUES (?, ?, ?, ?)").bind(inputs.attendance_uid, inputs.employee_uid, inputs.project_uid, inputs.status).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }        
    },

    async updateRegister(inputs: AttendanceUpdateRegisterBodyType): Promise<SuccessServiceResponse<undefined>> {        
        try {
            await database.prepare("UPDATE attendance_registers SET status = ? AND project_uid = ? WHERE attendance_uid = ? AND employee_uid = ?").bind(inputs.status, inputs.project_uid, inputs.attendance_uid, inputs.employee_uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }        
    },

    async deleteRegister(inputs: AttendanceDeleteRegisterBodyType): Promise<SuccessServiceResponse<undefined>> {        
        try {
            await database.prepare("DELETE FROM attendance_registers WHERE attendance_uid = ? AND employee_uid = ?").bind(inputs.attendance_uid, inputs.employee_uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            throw Responses.service.handler.error(error);
        }        
    },
    
    async getAllRegisters(inputs: GetAllAttendanceRegistersQueryType): Promise<SuccessServiceResponse<DataGridResponse<AttendanceRegisterType>>> {
        try {
            const tableName = "attendance_registers";
            let limit = "LIMIT " + inputs.take;
            let offset = "OFFSET " + inputs.skip;

            // console.log(inputs);

            const waitList = Object.keys(Schema.data.value.properties);
            
            const query: string[] = [`
                SELECT 
                    *
                FROM ${ tableName }
            `];
            let filter: string;
            let orderBy: string;
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
                const countQuery = `SELECT COUNT(*) as count FROM ${ tableName }`;
                if (inputs.searchText) {
                    countResult = await database.prepare([countQuery, filter!].join(" ")).bind(inputs.searchText).first() as { count: number };
                }
                else countResult = await database.prepare(countQuery).first() as { count: number };
            }

            // console.log(countResult);

            return Responses.service.handler.success({
                data: result.results as AttendanceRegisterType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<AttendanceRegisterType>)
        } catch (error) {
            if(Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}