import { env } from 'cloudflare:workers'
// import Responses from '../utils/response'

// Cloudflare bindings
// let database = env.db as Env['db'] & { getByUid: (table: string, uid: string) => Promise<object> }; // db = D1

// database.getByUid = async (table: string, uid: string) => {
//     try {
//         const result = await database.prepare(`SELECT * FROM ${ table } WHERE uid = ?`).bind(uid).first();
//         if (!result) throw Responses.service.handler.error(`Row not found in the ${ table } table`, 404);
//         return Responses.service.handler.success(result);
//     } catch (error) {
//         if(Responses.schema.data.check(error)) throw error;
//         throw Responses.service.handler.error(error);
//     }
// };

export default env.db;