import Schema from './schema';

export type PurchaseType = typeof Schema.data.value.static;
export type PurchaseCreateBodyType = typeof Schema.create.validation.body.static;
export type PurchaseUpdateBodyType = typeof Schema.update.validation.body.static;
export type PurchaseBatchBodyType = typeof Schema.batch.validation.body.static;
export type PurchaseGetAllQueryType = typeof Schema.getAll.validation.query.static;
