import Schema from './schema';

export type SupplierType = typeof Schema.data.value.static;
export type SupplierCreateBodyType = typeof Schema.create.validation.body.static;
export type SupplierUpdateBodyType = typeof Schema.update.validation.body.static;
