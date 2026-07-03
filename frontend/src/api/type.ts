export type ApiSuccess<T> = { success: true; detail: T; };
export type ApiError = { success: false; detail: any; };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;