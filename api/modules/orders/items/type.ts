import Schema from './schema';

export type ItemType = typeof Schema.data.value.static;
export type ItemCreateBodyType = typeof Schema.create.validation.body.static;
export type ItemUpdateBodyType = typeof Schema.update.validation.body.static;
export type ItemGetAllQueryType = typeof Schema.getAll.validation.query.static;