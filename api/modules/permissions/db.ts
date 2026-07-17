import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { PermissionType } from './type';

export default {
    // The full permission catalog, flat with parent_uid so the client can build the tree.
    // Parents (".access") come first, then children, each group sorted by name.
    async getAll(): Promise<SuccessServiceResponse<PermissionType[]>> {
        try {
            const result = await database.prepare(`
                SELECT uid, key, name, parent_uid, created_at
                FROM permissions
                ORDER BY (parent_uid IS NOT NULL), name
            `).all();
            return Responses.service.handler.success(result.results as PermissionType[]);
        } catch (error) {
            throw Responses.service.handler.error(error);
        }
    }
}
