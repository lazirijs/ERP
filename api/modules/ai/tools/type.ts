import type { TSchema } from "elysia";
import type { CallerType } from "../type";

/**
 * `read` tools execute automatically inside the agentic loop.
 * `write` tools stop the loop and wait for the user to confirm.
 */
export type ToolKind = "read" | "write";

export type Tool = {
    name: string;
    /**
     * Prescriptive about *when* to call, not just what it does -- that is what
     * actually drives the model to pick the right tool.
     */
    description: string;
    /** The module's own TypeBox schema, reused verbatim. Already JSON Schema. */
    schema: TSchema;
    kind: ToolKind;
    /** One-line plain-English summary of a proposed write, for the confirmation card. */
    summary?: (input: any) => string;
    execute: (input: any, caller: CallerType) => Promise<unknown>;
};
