import Schema from './schema'
import Plugin from "./plugin";

export type AuthUpdateProfileBodyType = typeof Schema.updateProfile.validation.body.static
export type AuthChangePasswordBodyType = typeof Schema.changePassword.validation.body.static
export type AuthUidPasswordType = typeof Schema.data.uidPassword.static
export type AuthLoginBodyType = typeof Schema.login.validation.body.static
export type AuthCookieType = typeof Schema.cookie.static
export type AuthPluginType = typeof Plugin