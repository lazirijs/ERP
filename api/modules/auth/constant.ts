import type { CookieOptions } from "elysia";

// The frontend reaches the API same-origin (prod: the /api Pages Function proxy; dev: the Vite
// /api proxy), so the auth cookie is first-party and 'lax' is enough. It must NOT be 'none':
// a SameSite=None cookie is the third-party cookie that browsers drop when "block third-party
// cookies" is on, which is exactly what broke cross-site login before the proxy.
const cookieOptions: CookieOptions = {
    maxAge: 30 * 86400,
    sameSite: 'lax',
    httpOnly: true,
    secure: true,
};

export default {
    cookieOptions
};