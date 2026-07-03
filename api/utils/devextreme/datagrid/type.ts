import dataGridSchema from "./schema";

export type DataGridQuery<T = {}> = typeof dataGridSchema.data.static & T;
export type DataGridResponse<T> = typeof dataGridSchema.response.static & { data: T[] };