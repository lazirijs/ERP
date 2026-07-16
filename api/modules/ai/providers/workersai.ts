import Constant from "../constant";
import { ai } from "../bindings";
import type { Provider, ChatMessage, ToolDefinition, ToolCall, GenerateResult } from "./type";

type EmbeddingResponse = { data: number[][] };

type RawArguments = Record<string, unknown> | string;

/**
 * Workers AI returns either its own shape or the OpenAI-compatible one
 * depending on the model, so both are normalised.
 */
type WorkersAiToolCall = {
    /** Present on the OpenAI-style shape; must be echoed back on the result. */
    id?: string;
    name?: string;
    arguments?: RawArguments;
    function?: { name: string; arguments?: RawArguments };
};

type GenerationResponse = {
    response?: string;
    tool_calls?: WorkersAiToolCall[];
};

// Workers AI expects the OpenAI-style envelope: a bare {name, description,
// parameters} is rejected with "Field required: body.tools.0.function".
// The TypeBox schema passes through untouched as `parameters` -- it is already
// JSON Schema, which is the whole point of reusing the module schemas.
const toWorkersAiTools = (tools: ToolDefinition[]) => tools.map(tool => ({
    type: "function",
    function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
    }
}));

// Internal ChatMessage -> Workers AI wire format. An assistant turn that called
// tools has to carry its tool_calls, and each result is matched back by id.
const toWorkersAiMessages = (messages: ChatMessage[]) => messages.map(message => {
    if (message.role === "assistant" && message.toolCalls?.length) {
        return {
            role: "assistant",
            content: message.content,
            tool_calls: message.toolCalls.map(call => ({
                id: call.id,
                type: "function",
                function: { name: call.name, arguments: JSON.stringify(call.input) }
            }))
        };
    }

    if (message.role === "tool") {
        return { role: "tool", name: message.name, tool_call_id: message.toolCallId, content: message.content };
    }

    return { role: message.role, content: message.content };
});

const parseArguments = (input: RawArguments | undefined): Record<string, unknown> => {
    if (typeof input !== "string") return input ?? {};
    try {
        return JSON.parse(input);
    } catch {
        // A model that emits malformed JSON gets caught by schema validation
        // downstream and told to retry, rather than throwing here.
        return {};
    }
};

/**
 * Llama sometimes *describes* a tool call in prose instead of emitting one --
 * e.g. `Your function call is: {"name": "search_documents", "parameters": {...}}`.
 * Left alone that lands in the user's chat as gibberish. Recovering it is
 * cheap and only triggers when the model returned no real tool_calls and the
 * text contains an object with both a name and an argument bag.
 */
const recoverTextToolCall = (text: string): ToolCall | null => {
    const start = text.indexOf("{");
    if (start === -1) return null;

    try {
        const candidate = JSON.parse(text.slice(start, text.lastIndexOf("}") + 1));
        const args = candidate?.parameters ?? candidate?.arguments;
        if (typeof candidate?.name !== "string" || !args || typeof args !== "object") return null;

        return { id: crypto.randomUUID(), name: candidate.name, input: args };
    } catch {
        return null;
    }
};

const provider: Provider = {
    async embed(texts) {
        if (!texts.length) return [];
        const result = await ai.run(Constant.models.embedding as any, { text: texts }) as EmbeddingResponse;
        return result.data;
    },

    async generate({ messages, tools }) {
        // No tools means this is a plain conversational turn -- route it to the
        // small fast model rather than paying ~25s of 70B inference to say hello.
        const model = tools?.length ? Constant.models.generation : Constant.models.conversation;

        const result = await ai.run(model as any, {
            messages: toWorkersAiMessages(messages),
            ...(tools?.length ? { tools: toWorkersAiTools(tools) } : {})
        }) as GenerationResponse;

        const toolCalls: ToolCall[] = (result.tool_calls ?? [])
            .map(call => ({
                // Preserve the model's own id -- the tool result is matched back
                // by it. Minting a new one leaves the call looking unanswered,
                // and the model just calls the same tool again.
                id: call.id ?? crypto.randomUUID(),
                name: call.function?.name ?? call.name ?? "",
                input: parseArguments(call.function?.arguments ?? call.arguments)
            }))
            .filter(call => call.name);

        const text = result.response ?? "";

        if (!toolCalls.length && tools?.length) {
            const recovered = recoverTextToolCall(text);
            if (recovered) return { text: "", toolCalls: [recovered] };
        }

        return { text, toolCalls } as GenerateResult;
    }
};

export default provider;
