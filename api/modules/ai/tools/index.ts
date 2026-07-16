import { Value } from "@sinclair/typebox/value";
import documents from "./documents";
import ERPTools from "./erp";
import type { Tool } from "./type";
import type { ToolDefinition } from "../providers/type";

const list: Tool[] = [...documents, ...ERPTools];

const byName = new Map(list.map(tool => [tool.name, tool]));

// Sent to the model on every turn. The TypeBox schema is already JSON Schema,
// so it passes straight through -- the provider wraps it under its own key.
const definitions: ToolDefinition[] = list.map(({ name, description, schema }) => ({
    name,
    description,
    parameters: schema
}));

const get = (name: string): Tool | undefined => byName.get(name);

export type ValidationResult =
    | { ok: true; value: any }
    | { ok: false; message: string };

/** True for a schema that accepts null, i.e. t.Nullable(...) -> anyOf: [..., {type:'null'}]. */
const allowsNull = (schema: any): boolean => schema?.type === "null" || (Array.isArray(schema?.anyOf) && schema.anyOf.some(allowsNull));

/**
 * Models routinely emit the *string* "null" for a nullable field. On a
 * t.Nullable(t.String()) that is a perfectly valid string, so validation passes
 * and the literal text "null" gets written -- as a dangling foreign key, in the
 * case of team_uid. Only rewritten where the schema actually permits null, so a
 * genuine string called "null" in a non-nullable field is left alone.
 */
const coerceNulls = (schema: any, input: Record<string, unknown>) => {
    const properties = schema?.properties;
    if (!properties) return input;

    for (const [key, value] of Object.entries(input)) {
        if ((value === "null" || value === "undefined" || value === "") && allowsNull(properties[key])) {
            input[key] = null;
        }
    }

    return input;
};

/**
 * Tools call the module `db.ts` services directly, which means they bypass the
 * validation Elysia would normally apply at the route. This re-applies it
 * against the same schema, and is the only thing standing between a model's
 * output and the database.
 */
const validate = (tool: Tool, input: unknown): ValidationResult => {
    // Clean strips keys the model invented; coerceNulls fixes the string "null";
    // Default fills omitted defaults; Convert coerces "45000" -> 45000, mirroring
    // what Elysia does for HTTP bodies.
    const cleaned = Value.Clean(tool.schema, structuredClone(input ?? {}));
    const nulled = coerceNulls(tool.schema, cleaned as Record<string, unknown>);
    const value = Value.Convert(tool.schema, Value.Default(tool.schema, nulled));

    if (Value.Check(tool.schema, value)) return { ok: true, value };

    const errors = [...Value.Errors(tool.schema, value)]
        .slice(0, 3)
        .map(error => `${ error.path || "(root)" } ${ error.message }`);

    return {
        ok: false,
        message: `Invalid arguments for ${ tool.name }: ${ errors.join("; ") }. Fix the arguments and call the tool again.`
    };
};

export default {
    list,
    definitions,
    get,
    validate
};
