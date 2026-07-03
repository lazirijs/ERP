import { Elysia } from 'elysia';
import Constant from './constant';
import { jwt } from '@elysiajs/jwt';
import { env } from 'cloudflare:workers';
import Responses from '../../utils/response';
import type { AuthCookieType } from './type';

const authPlugin = new Elysia()

.use(jwt({ name: 'jwt', secret: env.JWT_SECRET }))

.macro({
    auth: {
        resolve: async ({ jwt, cookie: { auth } }) => {
            if(!auth?.value) throw Responses.service.handler.error("Unauthorized", 401);
            const { user, expires_at } = await jwt.verify(auth!.value as string) as unknown as AuthCookieType;
            if(!user) throw Responses.service.handler.error("Unauthorized", 401);
            else if((Date.now() + (7 * 86400)) > expires_at) {
                const value = await jwt.sign({ user, expires_at: Date.now() + Constant.cookieOptions.maxAge! });
                auth?.set({ ...Constant.cookieOptions, value });
                // console.log("Token refreshed");
            }
            return { user };
        }
    }
});

export default authPlugin;