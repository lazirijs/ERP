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

const today = () => new Date().toISOString().slice(0, 10);

const parseRow = (row: any) => ({
    ...row,
    employee: row.employee ? JSON.parse(row.employee) : null,
    team: row.team ? JSON.parse(row.team) : null
});

const selectItem = `
    SELECT
        se.*,
        json_object('uid', e.uid, 'name', e.name) AS employee,
        CASE WHEN t.uid IS NOT NULL THEN json_object('uid', t.uid, 'name', t.name) ELSE NULL END AS team
    FROM session_employees se
    LEFT JOIN employees e ON se.employee_uid = e.uid
    LEFT JOIN teams t ON se.team_uid = t.uid
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
    return employee?.team_uid ?? null;
};

export default {
    async create(input: SessionEmployeeCreateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            const date = await requireEditableSession(input.session_uid);
            assertStatusAllowed(date, input.status);
            const team_uid = await resolveTeamUid(input.employee_uid, input.team_uid);
            await database
                .prepare("INSERT OR IGNORE INTO session_employees (session_uid, employee_uid, team_uid, status, note) VALUES (?, ?, ?, ?, ?)")
                .bind(input.session_uid, input.employee_uid, team_uid, input.status, input.note ?? '')
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
                    .bind(session_uid, row.employee_uid, team_uid, row.status, row.note ?? '')
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

            const conditions: string[] = [];
            const binds: unknown[] = [];

            if (inputs.session_uid) {
                conditions.push("se.session_uid = ?");
                binds.push(inputs.session_uid);
            }
            if (inputs.searchText) {
                conditions.push("e.name LIKE ?");
                binds.push(`%${ inputs.searchText }%`);
            }
            const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

            let orderBy = "ORDER BY se.created_at DESC";
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                const col = sortable[selector];
                if (col) orderBy = `ORDER BY ${ col } ${ desc ? "DESC" : "ASC" }`;
            }

            const query = [selectItem, where, orderBy, limit, offset].join(" ");
            const result = binds.length
                ? await database.prepare(query).bind(...binds).run()
                : await database.prepare(query).run();
            const data = (result.results as any[]).map(parseRow);

            let countResult = { count: -1 };
            if (inputs.requireTotalCount) {
                const countQuery = `SELECT COUNT(*) as count FROM session_employees se LEFT JOIN employees e ON se.employee_uid = e.uid ${ where }`;
                countResult = binds.length
                    ? await database.prepare(countQuery).bind(...binds).first() as { count: number }
                    : await database.prepare(countQuery).first() as { count: number };
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
            if (!row) throw Responses.service.handler.error("Session employee not found", 404);
            if (row.date < today()) throw Responses.service.handler.error("cannotEditPastSession", 400);
            assertStatusAllowed(row.date, input.status);
            await database.prepare("UPDATE session_employees SET status = ?, note = ? WHERE uid = ?")
                .bind(input.status, input.note ?? '', input.uid).run();
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
            if (!row) throw Responses.service.handler.error("Session employee not found", 404);
            if (row.date < today()) throw Responses.service.handler.error("cannotEditPastSession", 400);
            await database.prepare("DELETE FROM session_employees WHERE uid = ?").bind(uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}
