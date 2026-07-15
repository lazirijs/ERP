import { t } from "elysia";

const scope = t.Union([
    t.Literal("company"),
    t.Literal("personal"),
    t.Literal("module")
]);

// Per-module document namespaces. `source` is only meaningful when scope = "module".
const source = t.Union([
    t.Literal("projects"),
    t.Literal("products"),
    t.Literal("employees"),
    t.Literal("purchases"),
    t.Literal("")
]);

const status = t.Union([
    t.Literal("pending"),
    t.Literal("processing"),
    t.Literal("ready"),
    t.Literal("failed")
]);

const file = t.Object({
    uid: t.String(),
    r2_key: t.String(),
    company_uid: t.String(),
    scope,
    source,
    owner_uid: t.String(),
    file_name: t.String(),
    content_type: t.String(),
    size: t.Number(),
    status,
    chunk_count: t.Number(),
    error: t.String(),
    created_at: t.String({ format: "date-time" })
});

const thread = t.Object({
    uid: t.String(),
    company_uid: t.String(),
    user_uid: t.String(),
    title: t.String(),
    created_at: t.String({ format: "date-time" }),
    updated_at: t.String({ format: "date-time" })
});

const message = t.Object({
    uid: t.String(),
    thread_uid: t.String(),
    role: t.Union([t.Literal("user"), t.Literal("assistant"), t.Literal("tool")]),
    content: t.String(),
    citations: t.String(),
    created_at: t.String({ format: "date-time" })
});

const pendingAction = t.Object({
    uid: t.String(),
    thread_uid: t.String(),
    message_uid: t.String(),
    user_uid: t.String(),
    tool_name: t.String(),
    input: t.String(),
    status: t.Union([
        t.Literal("pending"),
        t.Literal("rejected"),
        t.Literal("executed"),
        t.Literal("failed")
    ]),
    result: t.String(),
    error: t.String(),
    created_at: t.String({ format: "date-time" }),
    executed_at: t.String()
});

const uidParams = t.Object({ uid: t.String() });

const scopeQuery = t.Object({
    scope: t.Optional(scope),
    source: t.Optional(source)
});

// No `type` constraint here on purpose: Elysia validates t.File types by
// sniffing the bytes, and text formats (txt/md/csv) are not detectable, so an
// allowlist here would reject them outright. The extension allowlist lives in
// the service instead -- see Constant.upload.extensions.
const uploadFileBody = t.Object({
    file: t.File({ maxSize: "25m" })
});

const uploadFileQuery = t.Object({
    scope,
    source: t.Optional(source)
});

const deleteFileBody = t.Object({ uid: file.properties.uid });

const createThreadBody = t.Object({
    title: t.Optional(t.String({ maxLength: 100 }))
});

const sendMessageBody = t.Object({
    content: t.String({ minLength: 1, maxLength: 4000 })
});

export default {
    data: {
        file,
        thread,
        message,
        pendingAction,
        scope,
        source
    },
    getFiles: {
        validation: {
            auth: true as const,
            query: scopeQuery
        }
    },
    uploadFile: {
        validation: {
            auth: true as const,
            query: uploadFileQuery,
            body: uploadFileBody
        }
    },
    deleteFile: {
        validation: {
            auth: true as const,
            body: deleteFileBody
        }
    },
    getThreads: {
        validation: {
            auth: true as const
        }
    },
    createThread: {
        validation: {
            auth: true as const,
            body: createThreadBody
        }
    },
    deleteThread: {
        validation: {
            auth: true as const,
            params: uidParams
        }
    },
    getMessages: {
        validation: {
            auth: true as const,
            params: uidParams
        }
    },
    sendMessage: {
        validation: {
            auth: true as const,
            params: uidParams,
            body: sendMessageBody
        }
    },
    action: {
        validation: {
            auth: true as const,
            params: uidParams
        }
    }
};
