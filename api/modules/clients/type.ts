import Schema from './schema';

export type ClientType = typeof Schema.data.value.static;
export type ClientCreateBodyType = typeof Schema.create.validation.body.static;
export type ClientUpdateBodyType = typeof Schema.update.validation.body.static;