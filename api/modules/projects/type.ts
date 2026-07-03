import Schema from './schema';

export type ProjectType = typeof Schema.data.value.static;
export type ProjectCreateBodyType = typeof Schema.create.validation.body.static;
export type ProjectGetAllQueryType = typeof Schema.getAll.validation.query.static;