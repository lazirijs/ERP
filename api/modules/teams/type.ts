import Schema from './schema';

export type TeamType = typeof Schema.data.value.static;
export type TeamCreateBodyType = typeof Schema.create.validation.body.static;
export type TeamUpdateBodyType = typeof Schema.update.validation.body.static;