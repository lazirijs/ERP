import Schema from './schema';

export type RegionType = typeof Schema.data.value.static;
export type RegionCreateBodyType = typeof Schema.create.validation.body.static;
export type RegionGetAllQueryType = typeof Schema.getAll.validation.query.static;