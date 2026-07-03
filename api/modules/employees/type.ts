import Schema from './schema';

export type EmployeeType = typeof Schema.data.value.static;
export type EmployeeCreateBodyType = typeof Schema.create.validation.body.static;
export type EmployeeUpdateBodyType = typeof Schema.update.validation.body.static;
export type EmployeeGetAllQueryType = typeof Schema.getAll.validation.query.static;