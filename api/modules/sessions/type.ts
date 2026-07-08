import Schema from './schema';

export type SessionType = typeof Schema.data.value.static;
export type SessionCreateBodyType = typeof Schema.create.validation.body.static;
export type SessionUpdateBodyType = typeof Schema.update.validation.body.static;
export type SessionGetAllQueryType = typeof Schema.getAll.validation.query.static;
