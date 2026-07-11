import Schema from './schema';

export type TransactionType = typeof Schema.data.value.static;
export type TransactionCreateBodyType = typeof Schema.create.validation.body.static;