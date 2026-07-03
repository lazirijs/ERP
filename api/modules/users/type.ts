import Schema from './schema';

export type UserType = typeof Schema.data.value.static;
export type UserCreateBodyType = typeof Schema.create.validation.body.static;
export type UserSafeType = typeof Schema.data.safe.static;
export type UserUpdateBodyType = typeof Schema.update.validation.body.static;