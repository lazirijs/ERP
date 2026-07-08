import Schema from './schema';

export type SessionEmployeeType = typeof Schema.data.value.static;
export type SessionEmployeeCreateBodyType = typeof Schema.create.validation.body.static;
export type SessionEmployeeBatchBodyType = typeof Schema.batch.validation.body.static;
export type SessionEmployeeUpdateBodyType = typeof Schema.update.validation.body.static;
export type SessionEmployeeGetAllQueryType = typeof Schema.getAll.validation.query.static;
