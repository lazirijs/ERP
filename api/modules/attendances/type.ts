import Schema from './schema';

export type AttendanceType = typeof Schema.data.value.static;
export type AttendanceRegisterType = typeof Schema.register.value.static;
export type AttendanceRegisterBodyType = typeof Schema.register.validation.body.static;
export type AttendanceUpdateRegisterBodyType = typeof Schema.updateRegister.validation.body.static;
export type AttendanceDeleteRegisterBodyType = typeof Schema.deleteRegister.validation.body.static;
export type GetAllAttendanceRegistersQueryType = typeof Schema.getAllRegisters.validation.query.static;