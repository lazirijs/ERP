import Schema from './schema';

export type OrderType = typeof Schema.data.value.static;
export type OrderCreateBodyType = typeof Schema.create.validation.body.static;
export type OrderUpdateBodyType = typeof Schema.update.validation.body.static;
export type OrderGetAllQueryType = typeof Schema.getAll.validation.query.static;