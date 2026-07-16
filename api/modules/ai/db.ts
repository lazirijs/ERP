import Constant from "./constant";
import Tools from "./tools";
import provider from "./providers";
import database from "../../database/ai";
import storage from "../../storage";
import { vectorize, ingestQueue } from "./bindings";
import Responses from "../../utils/response";
import type { SuccessServiceResponse } from "../../utils/response/type";
import type { ChatMessage } from "./providers/type";
import type {
    CallerType,
    ChatThreadType,
    ChatMessageType,
    CitationType,
    FilesIndexType,
    PendingActionType,
    ScopeQueryType,
    UploadFileQueryType
} from "./type";

/** What a chat turn returns: either a plain answer, or a write awaiting confirmation. */
type TurnResult = {
    messages: ChatMessageType[];
    pendingAction: PendingActionType | null;
};

const buildKey = (caller: CallerType, query: UploadFileQueryType, fileName: string) => {
    const extension = fileName.split(".").pop() || "bin";
    const id = crypto.randomUUID();
    const base = `ai/${ caller.company_uid }`;

    if (query.scope === "personal") return `${ base }/personal/${ caller.uid }/${ id }.${ extension }`;
    if (query.scope === "module") return `${ base }/module/${ query.source }/${ id }.${ extension }`;
    return `${ base }/company/${ id }.${ extension }`;
};

const ownsThread = async (caller: CallerType, uid: string) => {
    const thread = await database.prepare("SELECT * FROM chat_threads WHERE uid = ? AND user_uid = ?")
        .bind(uid, caller.uid)
        .first<ChatThreadType>();
    if (!thread) throw Responses.service.handler.error("Thread not found", 404);
    return thread;
};

/**
 * Replays only the conversation itself. Stored `tool` rows are kept for the
 * audit trail, but they are deliberately not replayed: their originating
 * tool_call ids are gone, so a bare tool message would be an orphan the model
 * cannot match to a call. Whatever mattered is already in the assistant's answer.
 */
const loadHistory = async (threadUid: string): Promise<ChatMessage[]> => {
    const { results } = await database.prepare(`
        SELECT role, content FROM chat_messages
        WHERE thread_uid = ? AND role IN ('user', 'assistant')
        ORDER BY created_at ASC
    `).bind(threadUid).all<{ role: "user" | "assistant"; content: string }>();

    return results.map(row => ({ role: row.role, content: row.content }));
};

/** Tool output can be a whole table; keep it from crowding out the context window. */
const capped = (value: unknown) => {
    const text = JSON.stringify(value) ?? "";
    return text.length > 4000 ? `${ text.slice(0, 4000) }… (truncated)` : text;
};

/**
 * Turns an upstream AI failure into something the user can act on.
 *
 * Workers AI reports quota exhaustion as a normal error, so without this every
 * cause -- out of neurons, expired dev proxy token, real outage -- reads as the
 * same unhelpful "couldn't reach the AI service", and the actual problem (the
 * daily allocation is gone until it resets) stays buried in the Worker logs.
 */
const explainAiFailure = (error: any): string => {
    const message = String(error?.message ?? error);

    // 4006: daily free-plan neuron allocation used up.
    if (message.includes("4006") || /neurons/i.test(message)) {
        return "The daily Workers AI allowance for this account has been used up, so I can't answer right now. It resets each day, or the Workers Paid plan removes the limit.";
    }

    // 3xxx / rate limiting.
    if (/rate.?limit|429/i.test(message)) {
        return "The AI service is rate limiting us at the moment. Please try again in a minute.";
    }

    return "Sorry, I couldn't reach the AI service just then. Please try again in a moment.";
};

/**
 * Guard for any reply generated without tools.
 *
 * A tool-less reply cannot have done anything -- but asked to "create the product
 * now", the model will happily answer "The new product has been created." That is
 * the worst failure this feature has: a fluent lie about a write that never
 * happened. The rule is in the system prompt too, but the small model ignores it
 * there, so it is repeated as the last thing before generation, where it sticks.
 */
const withoutToolsGuard = (messages: ChatMessage[]): ChatMessage[] => [
    ...messages,
    {
        role: "system",
        content: [
            "IMPORTANT: you have no tools available for this reply.",
            "You have NOT created, saved, updated, deleted, proposed or looked up anything.",
            "Never say or imply that you did -- no 'I've created', 'I've proposed', 'has been created'.",
            "If the user asked you to create or change something, tell them plainly that you couldn't do it this time and ask them to say it again."
        ].join(" ")
    }
];

/**
 * Decides whether a turn can skip the tool loop.
 *
 * Handing the 70B model a tool list puts it in tool-selection mode, where a
 * greeting either comes back as "Your request is incomplete" or sends it looping
 * through list_ tools -- and costs ~25s either way. Small talk gets a ~2s chat
 * call instead and never reaches the tools.
 *
 * It asks "is this only small talk?" rather than "does this need data?" on
 * purpose. The latter is open-ended and fails on anything outside its examples:
 * it judged "what are the skills listed in my CV?" as needing nothing, so the
 * question never reached search_documents and the model improvised. Recognising
 * a greeting is a far narrower job, and everything else falls through to the
 * tools -- so an unsure router costs a slow answer, never a wrong one.
 */
const isSmallTalk = async (message: string): Promise<boolean> => {
    try {
        const { text } = await provider.generate({
            messages: [
                {
                    role: "system",
                    content: [
                        "You classify one user message.",
                        "Answer YES only if it is purely a greeting, thanks, goodbye or small talk,",
                        "or asks who you are or what you can do, with no request for information.",
                        "Examples of YES: 'hi', 'hello', 'thanks!', 'how are you', 'who are you', 'what can you do'.",
                        "Answer NO for everything else: any question, any request, and anything mentioning a",
                        "document, file, CV, report, product, employee, project, purchase, or a task to carry out.",
                        "Reply with exactly one word: YES or NO."
                    ].join(" ")
                },
                { role: "user", content: message }
            ]
        });

        return /^\W*yes\b/i.test(text.trim());
    } catch {
        // Router is an optimisation, never a gate -- fall back to the tool loop.
        return false;
    }
};

const saveMessage = (threadUid: string, role: ChatMessageType["role"], content: string, citations: CitationType[] = []) =>
    database.prepare(`
        INSERT INTO chat_messages (thread_uid, role, content, citations)
        VALUES (?, ?, ?, ?)
        RETURNING *
    `).bind(threadUid, role, content, citations.length ? JSON.stringify(citations) : "").first<ChatMessageType>();

/**
 * The agentic loop.
 *
 * Read tools execute immediately and feed their result back to the model.
 * A write tool stops the loop: it is written to pending_actions and returned to
 * the UI as a proposal. Nothing reaches the management database until the user
 * confirms, which is the only gate on AI-driven writes.
 */
const runLoop = async (caller: CallerType, threadUid: string, seed?: ChatMessage): Promise<TurnResult> => {
    const produced: ChatMessageType[] = [];
    const citations: CitationType[] = [];
    const messages: ChatMessage[] = [
        { role: "system", content: Constant.systemPrompt },
        ...await loadHistory(threadUid),
        ...(seed ? [seed] : [])
    ];

    // Plain conversation never touches the tool loop -- it just talks.
    const lastUserMessage = [...messages].reverse().find(message => message.role === "user");
    if (!seed && lastUserMessage && await isSmallTalk(lastUserMessage.content)) {
        const { text } = await provider.generate({ messages: withoutToolsGuard(messages) });
        const message = await saveMessage(
            threadUid,
            "assistant",
            text.trim() || "Sorry, I didn't catch that. Could you rephrase?"
        );
        produced.push(message!);
        return { messages: produced, pendingAction: null };
    }

    // Whether a tool actually ran -- decides whether the model's prose is usable.
    let usedTools = false;

    for (let iteration = 0; iteration < Constant.maxToolIterations; iteration++) {
        let { text, toolCalls } = await provider.generate({ messages, tools: Tools.definitions });

        // No tools requested -- this is the answer.
        if (!toolCalls.length) {
            // The model was given tools and chose none: usually because nothing
            // fits ("add a client"). In tool-selection mode it says so to the
            // developer -- "Your function definitions are not comprehensive enough"
            // -- so re-ask without the tool list to get an answer for the user.
            // Once a tool has run there is a real result to summarise and the
            // reply is already fine, so leave that case alone.
            if (!usedTools) {
                const conversational = await provider.generate({ messages: withoutToolsGuard(messages) });
                text = conversational.text || text;
            }

            const message = await saveMessage(
                threadUid,
                "assistant",
                text.trim() || "Sorry, I didn't catch that. Could you rephrase?",
                citations
            );
            produced.push(message!);
            return { messages: produced, pendingAction: null };
        }

        // Replay the assistant's own tool_call turn before any result. Without
        // this the model does not recognise the results as answers to its own
        // call and just calls the same tool again until the loop gives up.
        messages.push({ role: "assistant", content: text, toolCalls });

        for (const call of toolCalls) {
            const tool = Tools.get(call.name);

            if (!tool) {
                messages.push({ role: "tool", name: call.name, toolCallId: call.id, content: `Unknown tool "${ call.name }". Use one of the provided tools.` });
                continue;
            }

            const validation = Tools.validate(tool, call.input);
            if (!validation.ok) {
                // Hand the error back to the model rather than failing the turn --
                // a weaker model gets a chance to correct its own arguments.
                messages.push({ role: "tool", name: call.name, toolCallId: call.id, content: validation.message });
                continue;
            }

            if (tool.kind === "write") {
                const proposal = text || `I'd like to ${ tool.summary?.(validation.value) ?? `run ${ tool.name }` }. Confirm to apply it.`;
                const message = await saveMessage(threadUid, "assistant", proposal, citations);
                produced.push(message!);

                const action = await database.prepare(`
                    INSERT INTO pending_actions (thread_uid, message_uid, user_uid, tool_name, input)
                    VALUES (?, ?, ?, ?, ?)
                    RETURNING *
                `).bind(threadUid, message!.uid, caller.uid, tool.name, JSON.stringify(validation.value)).first<PendingActionType>();

                return { messages: produced, pendingAction: action };
            }

            const result = await tool.execute(validation.value, caller);

            if (result && typeof result === "object" && "citations" in result) {
                citations.push(...(result as { citations: CitationType[] }).citations);
            }

            usedTools = true;

            const content = capped(result);
            messages.push({ role: "tool", name: call.name, toolCallId: call.id, content });
            produced.push((await saveMessage(threadUid, "tool", content))!);
        }
    }

    // Ran out of iterations while still calling tools. Everything looked up so far
    // is in `messages`, so ask once without the tool list: that both stops the
    // looping and usually produces a real answer instead of an apology.
    const { text } = await provider.generate({ messages });
    const message = await saveMessage(
        threadUid,
        "assistant",
        text.trim() || "Sorry, I got a bit lost working that out. Could you ask me one thing at a time?",
        citations
    );
    produced.push(message!);
    return { messages: produced, pendingAction: null };
};

export default {
    // --- Files ---

    async getFiles(caller: CallerType, query: ScopeQueryType): Promise<SuccessServiceResponse<FilesIndexType[]>> {
        try {
            // Listed from the ledger rather than R2: every AI document gets a row at
            // upload time, and only the ledger knows ingestion status. R2 still owns the bytes.
            const conditions = ["company_uid = ?"];
            const binds: unknown[] = [caller.company_uid];

            if (query.scope) {
                conditions.push("scope = ?");
                binds.push(query.scope);
            }
            if (query.source) {
                conditions.push("source = ?");
                binds.push(query.source);
            }

            // Personal documents are only ever visible to their owner.
            conditions.push("(scope <> 'personal' OR owner_uid = ?)");
            binds.push(caller.uid);

            const { results } = await database.prepare(`
                SELECT * FROM files_index
                WHERE ${ conditions.join(" AND ") }
                ORDER BY created_at DESC
            `).bind(...binds).all<FilesIndexType>();

            return Responses.service.handler.success(results);
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async uploadFile(caller: CallerType, query: UploadFileQueryType, file: File): Promise<SuccessServiceResponse<FilesIndexType>> {
        try {
            if (query.scope === "module" && !query.source) {
                throw Responses.service.handler.error("A module-scoped document needs a source", 400);
            }

            const extension = (file.name.split(".").pop() || "").toLowerCase();
            if (!Constant.upload.extensions.includes(extension)) {
                throw Responses.service.handler.error(
                    `Unsupported file type ".${ extension }". Allowed: ${ Constant.upload.extensions.join(", ") }`,
                    400
                );
            }

            const key = buildKey(caller, query, file.name);

            await storage.put(key, await file.arrayBuffer(), {
                httpMetadata: { contentType: file.type },
                customMetadata: {
                    fileName: file.name,
                    scope: query.scope,
                    source: query.source ?? "",
                    owner_uid: caller.uid
                }
            });

            const row = await database.prepare(`
                INSERT INTO files_index (r2_key, company_uid, scope, source, owner_uid, file_name, content_type, size)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING *
            `).bind(
                key,
                caller.company_uid,
                query.scope,
                query.source ?? "",
                query.scope === "personal" ? caller.uid : "",
                file.name,
                file.type,
                file.size
            ).first<FilesIndexType>();

            // Extraction + embedding is far too slow for the request; the UI polls status.
            await ingestQueue.send({ file_uid: row!.uid });

            return Responses.service.handler.success(row!);
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async deleteFile(caller: CallerType, uid: string): Promise<SuccessServiceResponse<undefined>> {
        try {
            const file = await database.prepare("SELECT * FROM files_index WHERE uid = ? AND company_uid = ?")
                .bind(uid, caller.company_uid)
                .first<FilesIndexType>();

            if (!file) throw Responses.service.handler.error("File not found", 404);
            if (file.scope === "personal" && file.owner_uid !== caller.uid) {
                throw Responses.service.handler.error("File not found", 404);
            }

            // Vectors first: an orphaned vector would keep surfacing in search
            // results for a file the user believes is gone.
            if (file.chunk_count > 0) {
                await vectorize.deleteByIds(
                    Array.from({ length: file.chunk_count }, (_, index) => `${ uid }:${ index }`)
                );
            }

            await storage.delete(file.r2_key);
            await database.prepare("DELETE FROM files_index WHERE uid = ?").bind(uid).run();

            return Responses.service.handler.success();
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    // --- Threads ---

    async getThreads(caller: CallerType): Promise<SuccessServiceResponse<ChatThreadType[]>> {
        try {
            const { results } = await database.prepare(`
                SELECT * FROM chat_threads
                WHERE user_uid = ?
                ORDER BY updated_at DESC
            `).bind(caller.uid).all<ChatThreadType>();

            return Responses.service.handler.success(results);
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async createThread(caller: CallerType, title?: string): Promise<SuccessServiceResponse<ChatThreadType>> {
        try {
            const thread = await database.prepare(`
                INSERT INTO chat_threads (company_uid, user_uid, title)
                VALUES (?, ?, ?)
                RETURNING *
            `).bind(caller.company_uid, caller.uid, title ?? "").first<ChatThreadType>();

            return Responses.service.handler.success(thread!);
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async deleteThread(caller: CallerType, uid: string): Promise<SuccessServiceResponse<undefined>> {
        try {
            await ownsThread(caller, uid);
            await database.prepare("DELETE FROM chat_threads WHERE uid = ?").bind(uid).run();
            return Responses.service.handler.success();
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async getMessages(caller: CallerType, uid: string): Promise<SuccessServiceResponse<{ messages: ChatMessageType[]; pendingActions: PendingActionType[] }>> {
        try {
            await ownsThread(caller, uid);

            const { results: messages } = await database.prepare(`
                SELECT * FROM chat_messages WHERE thread_uid = ? ORDER BY created_at ASC
            `).bind(uid).all<ChatMessageType>();

            const { results: pendingActions } = await database.prepare(`
                SELECT * FROM pending_actions WHERE thread_uid = ? ORDER BY created_at ASC
            `).bind(uid).all<PendingActionType>();

            return Responses.service.handler.success({ messages, pendingActions });
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    // --- Chat ---

    async sendMessage(caller: CallerType, threadUid: string, content: string): Promise<SuccessServiceResponse<TurnResult>> {
        try {
            const thread = await ownsThread(caller, threadUid);

            await saveMessage(threadUid, "user", content);

            // First message doubles as the thread title.
            if (!thread.title) {
                await database.prepare("UPDATE chat_threads SET title = ? WHERE uid = ?")
                    .bind(content.slice(0, 60), threadUid)
                    .run();
            }

            let result: TurnResult;
            try {
                result = await runLoop(caller, threadUid);
            } catch (error) {
                // The user's message is already persisted. If the turn dies here
                // (upstream AI outage, expired dev proxy token) and we just rethrow,
                // the thread is left with a question and no answer -- it reads as if
                // the assistant ignored them. Answer honestly instead.
                console.log("AI turn failed", error);
                const message = await saveMessage(threadUid, "assistant", explainAiFailure(error));
                result = { messages: [message!], pendingAction: null };
            }

            await database.prepare("UPDATE chat_threads SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE uid = ?")
                .bind(threadUid)
                .run();

            return Responses.service.handler.success(result);
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    // --- Actions (the write gate) ---

    async confirmAction(caller: CallerType, uid: string): Promise<SuccessServiceResponse<TurnResult>> {
        try {
            const action = await database.prepare("SELECT * FROM pending_actions WHERE uid = ? AND user_uid = ?")
                .bind(uid, caller.uid)
                .first<PendingActionType>();

            if (!action) throw Responses.service.handler.error("Action not found", 404);
            if (action.status !== "pending") throw Responses.service.handler.error("This action has already been resolved", 409);

            const tool = Tools.get(action.tool_name);
            if (!tool) throw Responses.service.handler.error("Unknown tool", 400);

            // Re-validate at execution time: the row has been sitting in the
            // database since it was proposed, and this is the last gate before a write.
            const validation = Tools.validate(tool, JSON.parse(action.input));
            if (!validation.ok) {
                await database.prepare("UPDATE pending_actions SET status = 'failed', error = ? WHERE uid = ?")
                    .bind(validation.message, uid)
                    .run();
                throw Responses.service.handler.error(validation.message, 400);
            }

            let result: unknown;
            try {
                result = await tool.execute(validation.value, caller);
            } catch (error: any) {
                await database.prepare("UPDATE pending_actions SET status = 'failed', error = ? WHERE uid = ?")
                    .bind(error?.message || "Execution failed", uid)
                    .run();
                throw Responses.service.handler.error(error);
            }

            await database.prepare(`
                UPDATE pending_actions
                SET status = 'executed', result = ?, executed_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
                WHERE uid = ?
            `).bind(JSON.stringify(result ?? {}), uid).run();

            await saveMessage(action.thread_uid, "tool", JSON.stringify({ tool: action.tool_name, status: "confirmed by user", result }));

            // Let the model summarise what just happened. Seeded explicitly:
            // stored tool rows are not replayed, so this is how the outcome reaches it.
            return Responses.service.handler.success(await runLoop(caller, action.thread_uid, {
                role: "user",
                content: `[system] The user confirmed the ${ action.tool_name } action and it has now been saved. Result: ${ JSON.stringify(result ?? {}) }. Confirm to the user in one short sentence. Do not call any tool.`
            }));
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async rejectAction(caller: CallerType, uid: string): Promise<SuccessServiceResponse<TurnResult>> {
        try {
            const action = await database.prepare("SELECT * FROM pending_actions WHERE uid = ? AND user_uid = ?")
                .bind(uid, caller.uid)
                .first<PendingActionType>();

            if (!action) throw Responses.service.handler.error("Action not found", 404);
            if (action.status !== "pending") throw Responses.service.handler.error("This action has already been resolved", 409);

            await database.prepare("UPDATE pending_actions SET status = 'rejected' WHERE uid = ?").bind(uid).run();

            await saveMessage(
                action.thread_uid,
                "tool",
                JSON.stringify({ tool: action.tool_name, status: "rejected by user -- it was not applied." })
            );

            return Responses.service.handler.success(await runLoop(caller, action.thread_uid, {
                role: "user",
                content: `[system] The user declined the ${ action.tool_name } action. Nothing was saved. Acknowledge in one short sentence and ask what they'd like to change. Do not call any tool and do not retry it.`
            }));
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
};
