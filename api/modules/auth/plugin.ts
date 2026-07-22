import { Elysia } from 'elysia';
import Constant from './constant';
import { jwt } from '@elysiajs/jwt';
import { env } from 'cloudflare:workers';
import Responses from '../../utils/response';
import db from './db';
import Users from '../users';
import type { AuthCookieType, AuthRecordType } from './type';
import type { UserSafeType } from '../users/type';

const maxAge = Constant.cookieOptions.maxAge!;

// Minimal shape of what the auth/permission macro resolvers receive from Elysia — enough to
// verify/re-issue the JWT cookie without pulling in the full (heavily generic) context type.
type AuthContext = {
    jwt: { sign: (payload: Record<string, unknown>) => Promise<string>; verify: (token: string) => Promise<unknown> };
    cookie: { auth?: { value?: unknown; set: (options: Record<string, unknown>) => void } };
};

// Re-validate the session against the DB on every request. The JWT only carries the email +
// password hash; the source of truth is the users table, so a deactivated/deleted account or
// a changed password invalidates existing cookies immediately. On any failure we also clear
// the cookie so the browser drops it alongside the error, and the frontend logs out.
const authenticate = async ({ jwt, cookie: { auth } }: AuthContext): Promise<UserSafeType> => {
    const clear = () => auth?.set({ ...Constant.cookieOptions, value: '', maxAge: 0 });

    if (!auth?.value) throw Responses.service.handler.error("Unauthorized", 401);

    const payload = await jwt.verify(auth.value as string) as unknown as AuthCookieType;
    if (!payload || !payload.email || !payload.password) {
        clear();
        throw Responses.service.handler.error("Your session is no longer valid, please log in again", 401);
    }

    const record = await db.getAuthByEmail(payload.email);
    if (!record) {
        clear();
        throw Responses.service.handler.error("Your session is no longer valid, please log in again", 401);
    }
    if (record.password !== payload.password) {
        clear();
        throw Responses.service.handler.error("Your password has changed, please log in again", 401);
    }
    if (record.status !== 1) {
        clear();
        // 401 (not 403) so the frontend interceptor treats it as a dead session and logs out,
        // rather than a per-action permission denial that keeps the user signed in.
        throw Responses.service.handler.error("Your account is inactive, please contact an administrator", 401);
    }

    // Refresh the token as it nears expiry, re-signing with the current email + hash.
    if ((Date.now() + (7 * 86400)) > payload.expires_at) {
        const value = await jwt.sign({ email: record.email, password: record.password, expires_at: Date.now() + maxAge });
        auth?.set({ ...Constant.cookieOptions, value });
    }

    const { password, ...user } = record;
    return user;
};

const authPlugin = new Elysia()

.use(jwt({ name: 'jwt', secret: env.JWT_SECRET }))

.macro({
    // Authentication only — any signed-in, active account may proceed.
    auth: {
        resolve: async (ctx) => ({ user: await authenticate(ctx as unknown as AuthContext) })
    },

    // Authentication + a specific permission key. Admins (is_admin) bypass the check, matching
    // Users.db.getPermissions which already resolves them to the full catalog.
    permission(required: string) {
        return {
            resolve: async (ctx) => {
                const user = await authenticate(ctx as unknown as AuthContext);
                if (user.is_admin !== 1) {
                    const { detail: keys } = await Users.db.getPermissions(user.uid);
                    if (!keys.includes(required)) {
                        throw Responses.service.handler.error("You don't have permission to perform this action", 403);
                    }
                }
                return { user };
            }
        };
    }
});

export default authPlugin;
