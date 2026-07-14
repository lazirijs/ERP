import Schema from './schema'
import database from '../../../database'
import Responses from '../../../utils/response';
import type { SuccessServiceResponse } from '../../../utils/response/type';
import type { DataGridResponse } from '../../../utils/devextreme/datagrid/type';
import type {
    SessionEmployeeType,
    SessionEmployeeCreateBodyType,
    SessionEmployeeBatchBodyType,
    SessionEmployeeUpdateBodyType,
    SessionEmployeeGetAllQueryType
} from './type';
import { buildDataGridSQLiteConditions } from '../../../utils/devextreme/datagrid/service';

const today = () => new Date().toISOString().slice(0, 10);

const parseRow = (row: any) => ({
    ...row,
    employee: row.employee ? JSON.parse(row.employee) : null,
    team: row.team ? JSON.parse(row.team) : null
});

const itemsFrom = `
    FROM session_employees se
    LEFT JOIN employees e ON se.employee_uid = e.uid
    LEFT JOIN teams t ON se.team_uid = t.uid
    LEFT JOIN sessions s ON se.session_uid = s.uid
`;

const selectItem = `
    SELECT
        se.*,
        s.date AS date,
        json_object('uid', e.uid, 'name', e.name, 'image', e.image) AS employee,
        CASE WHEN t.uid IS NOT NULL THEN json_object('uid', t.uid, 'name', t.name) END AS team
    ${ itemsFrom }
`;

const sortable: Record<string, string> = {
    status: "se.status",
    note: "se.note",
    created_at: "se.created_at"
};

// Load the parent session's date and enforce the "past = locked" rule for any write.
const requireEditableSession = async (session_uid: string): Promise<string> => {
    const session = await database.prepare("SELECT date FROM sessions WHERE uid = ?").bind(session_uid).first<{ date: string }>();
    if (!session) throw Responses.service.handler.error("Session not found", 404);
    if (session.date < today()) throw Responses.service.handler.error("cannotEditPastSession", 400);
    return session.date;
};

// present (status 0) is only allowed on today or earlier
const assertStatusAllowed = (date: string, status: number) => {
    if (status === 0 && date > today()) throw Responses.service.handler.error("cannotMarkPresentForFutureDate", 400);
};

const resolveTeamUid = async (employee_uid: string, provided?: string | null): Promise<string | null> => {
    if (provided !== undefined && provided !== null) return provided;
    const employee = await database.prepare("SELECT team_uid FROM employees WHERE uid = ?").bind(employee_uid).first<{ team_uid: string | null }>();
    return employee?.team_uid || null;
};

export default {
    async create(input: SessionEmployeeCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            const date = await requireEditableSession(input.session_uid);
            assertStatusAllowed(date, input.status);
            const team_uid = await resolveTeamUid(input.employee_uid, input.team_uid);
            await database
                .prepare("INSERT OR IGNORE INTO session_employees (session_uid, employee_uid, team_uid, status, note) VALUES (?, ?, ?, ?, ?)")
                .bind(input.session_uid, input.employee_uid, team_uid || null, input.status, input.note || null)
                .run();
            return Responses.service.handler.success();
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async createBatch({ session_uid, rows }: SessionEmployeeBatchBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            const date = await requireEditableSession(session_uid);
            for (const row of rows) {
                assertStatusAllowed(date, row.status);
                const team_uid = await resolveTeamUid(row.employee_uid, row.team_uid);
                await database
                    .prepare("INSERT OR IGNORE INTO session_employees (session_uid, employee_uid, team_uid, status, note) VALUES (?, ?, ?, ?, ?)")
                    .bind(session_uid, row.employee_uid, team_uid || null, row.status, row.note || null)
                    .run();
            }
            return Responses.service.handler.success();
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getByUid(uid: SessionEmployeeType["uid"]): Promise<SuccessServiceResponse<SessionEmployeeType>> {
        try {
            const result = await database.prepare(`${ selectItem } WHERE se.uid = ?`).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Session employee not found", 404);
            return Responses.service.handler.success(parseRow(result) as SessionEmployeeType);
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getAll(inputs: SessionEmployeeGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<SessionEmployeeType>>> {
        try {
            const limit = "LIMIT " + inputs.take;
            const offset = "OFFSET " + inputs.skip;

            const { conditions, binds } = buildDataGridSQLiteConditions({
                searchText: inputs.searchText,
                filters: inputs.filters,
                columns: {
                    'employee.name': { searchText: 'e.name', values: 'se.employee_uid' },
                    'team.name': { searchText: 't.name', values: 'se.team_uid' },
                    'session.name': { searchText: 'se.name', values: 'se.session_uid' },
                    note: { searchText: 'se.note', values: 'se.note' },
                    status: { searchText: 'se.status', values: 'se.status' },
                    created_at: { searchText: 'se.created_at', values: 'se.created_at' }
                },
                excludeColumnsFromSearchText: [...(inputs.excludeColumnsFromSearchText || []), 'status', 'session.name']
            });

            if (inputs.session_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "se.session_uid = ?");
                binds.push(inputs.session_uid);
            }
            if (inputs.employee_uid) {
                conditions.push(conditions.length ? "AND" : "WHERE", "se.employee_uid = ?");
                binds.push(inputs.employee_uid);
            }
            if (inputs.from) {
                conditions.push(conditions.length ? "AND" : "WHERE", "s.date >= ?");
                binds.push(inputs.from);
            }
            if (inputs.to) {
                conditions.push(conditions.length ? "AND" : "WHERE", "s.date <= ?");
                binds.push(inputs.to);
            }

            let orderBy = "ORDER BY se.created_at DESC";
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                const col = sortable[selector];
                if (col) orderBy = `ORDER BY ${ col } ${ desc ? "DESC" : "ASC" }`;
            }

            const query = [selectItem, ...conditions, orderBy, limit, offset].join(" ");
            const prepare = database.prepare(query);
            const result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();
            const data = (result.results as any[]).map(parseRow);

            let countResult = { count: -1 };
            if (inputs.requireTotalCount) {
                const countQuery = [`SELECT COUNT(*) as count`, itemsFrom, ...conditions].join(" ");
                const countPrepare = database.prepare(countQuery);
                countResult = binds.length
                    ? await countPrepare.bind(...binds).first() as { count: number }
                    : await countPrepare.first() as { count: number };
            }

            return Responses.service.handler.success({
                data: data as SessionEmployeeType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<SessionEmployeeType>)
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(input: SessionEmployeeUpdateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            const row = await database.prepare(`
                SELECT s.date as date FROM session_employees se
                JOIN sessions s ON se.session_uid = s.uid
                WHERE se.uid = ?
            `).bind(input.uid).first<{ date: string }>();
            if (!row?.date) throw Responses.service.handler.error("Session employee not found", 404);
            if (row.date < today()) throw Responses.service.handler.error("cannotEditPastSession", 400);
            assertStatusAllowed(row.date, input.status);
            await database.prepare("UPDATE session_employees SET status = ?, note = ? WHERE uid = ?")
                .bind(input.status, input.note || null, input.uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async delete(uid: SessionEmployeeType["uid"]): Promise<SuccessServiceResponse<undefined>> {
        try {
            const row = await database.prepare(`
                SELECT s.date as date FROM session_employees se
                JOIN sessions s ON se.session_uid = s.uid
                WHERE se.uid = ?
            `).bind(uid).first<{ date: string }>();
            if (!row?.date) throw Responses.service.handler.error("Session employee not found", 404);
            if (row.date < today()) throw Responses.service.handler.error("cannotEditPastSession", 400);
            await database.prepare("DELETE FROM session_employees WHERE uid = ?").bind(uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}
