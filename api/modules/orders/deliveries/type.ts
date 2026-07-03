import Schema from './schema';

export type DeliveryType = typeof Schema.data.value.static;
export type DeliveryCreateBodyType = typeof Schema.create.validation.body.static;
export type DeliveryUpdateBodyType = typeof Schema.update.validation.body.static;
export type DeliveryGetAllQueryType = typeof Schema.getAll.validation.query.static;