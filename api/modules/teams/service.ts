import type { TeamCreateBodyType } from "./type";
import Responses from '../../utils/response';
import employees from "../employees";
import db from "./db";

const create = async (inputs: TeamCreateBodyType) => {
    try {
        const creation = await db.create(inputs);
        if (creation.success) await employees.db.setTeam({ uid: inputs.supervisor_uid, team_uid: creation.detail.uid });
        return creation;
    } catch (error: any) {
        throw Responses.service.handler.error(error);
    }
}

export default {
    create
}