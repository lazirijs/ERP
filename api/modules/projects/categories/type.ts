import Schema from './schema';

export type CategoryType = typeof Schema.data.value.static;
export type CategoryCreateBodyType = typeof Schema.create.validation.body.static;