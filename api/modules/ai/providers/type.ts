import type { TSchema } from "elysia";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
    role: ChatRole;
    content: string;
    /** Set on `tool` messages: the tool that produced this result. */
    name?: string;
    /**
     * Set on `tool` messages: the id of the tool_call this answers. Must be the
     * id the model itself emitted, or it cannot match the result to its call.
     */
    toolCallId?: string;
    /**
     * Set on the `assistant` turn that requested tools. This must be replayed
     * before the matching `tool` results, or the model does not recognise the
     * results as answers to its own call and simply calls again.
     */
    toolCalls?: ToolCall[];
};

/**
 * `parameters` is the module's own TypeBox schema, which is already JSON Schema.
 * Each provider wraps it under whatever key it expects (Workers AI: `parameters`,
 * Anthropic: `input_schema`) -- the schema body itself is identical.
 */
export type ToolDefinition = {
    name: string;
    description: string;
    parameters: TSchema;
};

export type ToolCall = {
    id: string;
    name: string;
    input: Record<string, unknown>;
};

export type GenerateResult = {
    text: string;
    toolCalls: ToolCall[];
};

export interface Provider {
    embed(texts: string[]): Promise<number[][]>;
    generate(input: { messages: ChatMessage[]; tools?: ToolDefinition[] }): Promise<GenerateResult>;
}
