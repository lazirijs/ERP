import { t } from "elysia";
import ResponseConstent from "./constant";
import { TypeCompiler } from '@sinclair/typebox/compiler'

const data = t.Union([
    t.Object({ success: t.Literal(true), code: t.Union(ResponseConstent.httpStatusCodes.success.map(code => t.Literal(code))), detail: t.Optional(t.Any()) }),
    t.Object({ success: t.Literal(false), code: t.Union(ResponseConstent.httpStatusCodes.error.map(code => t.Literal(code))), detail: t.Optional(t.Any()) })
]);

const compile = TypeCompiler.Compile(data);

export default {
    data: {
        value: data,
        check: (value: unknown) => compile.Check(value)
    },
};