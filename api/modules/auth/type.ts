import Schema from './schema'
import Plugin from "./plugin";
import type { UserSafeType } from '../users/type';

export type AuthUpdateProfileBodyType = typeof Schema.updateProfile.validation.body.static
export type AuthChangePasswordBodyType = typeof Schema.changePassword.validation.body.static
export type AuthUidPasswordType = typeof Schema.data.uidPassword.static
export type AuthLoginBodyType = typeof Schema.login.validation.body.static
export type AuthCookieType = typeof Schema.cookie.static
export type AuthPluginType = typeof Plugin

// The safe user row plus the stored password hash — what getAuthByEmail returns for the
// per-request re-validation. Strip `password` before handing the user to route handlers.
export type AuthRecordType = UserSafeType & { password: string }