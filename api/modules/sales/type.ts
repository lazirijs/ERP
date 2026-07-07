import Schema from './schema';

export type SaleType = typeof Schema.data.value.static;
export type SaleCreateBodyType = typeof Schema.create.validation.body.static;
export type SaleUpdateBodyType = typeof Schema.update.validation.body.static;
