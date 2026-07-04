import Schema from './schema';

export type ProductType = typeof Schema.data.value.static;
export type ProductCreateBodyType = typeof Schema.create.validation.body.static;
export type ProductUpdateBodyType = typeof Schema.update.validation.body.static;
export type ProductImageType = typeof Schema.data.image.static;
