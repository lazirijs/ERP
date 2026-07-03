import Schema from './schema';

export type DeliveryItemType = typeof Schema.data.value.static;
export type DeliveryItemCreateBodyType = typeof Schema.create.validation.body.static;
export type DeliveryItemUpdateBodyType = typeof Schema.update.validation.body.static;
export type DeliveryItemGetAllQueryType = typeof Schema.getAll.validation.query.static;