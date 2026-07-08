import Schema from './schema'
import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { SessionType, SessionCreateBodyType, SessionUpdateBodyType, SessionGetAllQueryType } from './type';
import type { DataGridResponse } from '../../utils/devextreme/datagrid/type';

const today = () => new Date().toISOString().slice(0, 10);

const isUniqueError = (error: unknown) => String((error as any)?.message ?? error).includes("UNIQUE");

export default {
    async create(input: SessionCreateBodyType): Promise<SuccessServiceResponse<{ uid: string }>> {
        try {
            if (input.date < today()) throw Responses.service.handler.error("cannotCreateSessionForPastDate", 400);
            const result = await database
                .prepare("INSERT INTO sessions (date, note) VALUES (?, ?) RETURNING uid")
                .bind(input.date, input.note ?? '')
                .first<{ uid: string }>();
            return Responses.service.handler.success(result!);
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            if (isUniqueError(error)) throw Responses.service.handler.error("dateAlreadyTaken", 400);
            throw Responses.service.handler.error(error);
        }
    },

    async getByUid(uid: SessionType["uid"]): Promise<SuccessServiceResponse<SessionType>> {
        try {
            const result = await database.prepare(`SELECT * FROM sessions WHERE uid = ?`).bind(uid).first();
            if (!result) throw Responses.service.handler.error("Session not found", 404);
            return Responses.service.handler.success(result as SessionType);
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getAll(inputs: SessionGetAllQueryType): Promise<SuccessServiceResponse<DataGridResponse<SessionType>>> {
        try {
            const limit = "LIMIT " + inputs.take;
            const offset = "OFFSET " + inputs.skip;

            const waitList = Object.keys(Schema.data.value.properties);

            const conditions: string[] = [];
            const binds: unknown[] = [];

            if (inputs.from) {
                conditions.push("date >= ?");
                binds.push(inputs.from);
            }
            if (inputs.to) {
                conditions.push("date <= ?");
                binds.push(inputs.to);
            }
            if (inputs.searchText) {
                conditions.push("date LIKE ?");
                binds.push(`%${ inputs.searchText }%`);
            }
            const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

            let orderBy = "ORDER BY date DESC";
            if (inputs.sort?.length) {
                const { selector, desc } = inputs.sort[0]!;
                if (!waitList.includes(selector)) throw Responses.service.handler.error("Invalid sort field: " + selector, 400);
                orderBy = `ORDER BY ${ selector } ${ desc ? "DESC" : "ASC" }`;
            }

            const query = [`SELECT * FROM sessions`, where, orderBy, limit, offset].join(" ");
            const prepare = database.prepare(query);
            const result = binds.length ? await prepare.bind(...binds).run() : await prepare.run();

            let countResult = { count: -1 };
            if (inputs.requireTotalCount) {
                const countQuery = [`SELECT COUNT(*) as count FROM sessions`, where].join(" ");
                countResult = binds.length
                    ? await database.prepare(countQuery).bind(...binds).first() as { count: number }
                    : await database.prepare(countQuery).first() as { count: number };
            }

            return Responses.service.handler.success({
                data: result.results as SessionType[],
                totalCount: countResult.count,
                summary: {},
                groupCount: -1
            } as DataGridResponse<SessionType>)
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async update(input: SessionUpdateBodyType): Promise<SuccessServiceResponse<undefined>> {
        try {
            const current = await database.prepare("SELECT date FROM sessions WHERE uid = ?").bind(input.uid).first<{ date: string }>();
            if (!current) throw Responses.service.handler.error("Session not found", 404);
            if (current.date < today()) throw Responses.service.handler.error("cannotEditPastSession", 400);
            if (input.date < today()) throw Responses.service.handler.error("cannotCreateSessionForPastDate", 400);
            await database.prepare("UPDATE sessions SET date = ?, note = ? WHERE uid = ?").bind(input.date, input.note ?? '', input.uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            if (isUniqueError(error)) throw Responses.service.handler.error("dateAlreadyTaken", 400);
            throw Responses.service.handler.error(error);
        }
    }
}
