import Schema from './schema';

export type AccountType = typeof Schema.data.value.static;
export type AccountCreateBodyType = typeof Schema.create.validation.body.static;
export type AccountUpdateBodyType = typeof Schema.update.validation.body.static;