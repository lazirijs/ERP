import type { CookieOptions } from "elysia";

const cookieOptions: CookieOptions = {
    maxAge: 30 * 86400,
    sameSite: 'none',
    httpOnly: true,
    secure: true,
};

export default {
    cookieOptions
};