export default {
    // Single tenant for now: seeded by the first ai_db migration.
    defaultCompanyUid: "00000000000000000000000000000001",

    provider: "workersai" as const,

    models: {
        // Supports function calling, which the tool loop depends on.
        generation: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        // 1024 dimensions -- the Vectorize index must be created to match.
        embedding: "@cf/baai/bge-m3"
    },

    embeddingDimensions: 1024,

    upload: {
        // Everything AI.toMarkdown can read: documents, spreadsheets, plain text,
        // and images (which it OCRs). Checked by extension because Elysia's
        // t.File type check sniffs bytes and cannot detect text formats.
        extensions: [
            "pdf",
            "docx", "doc",
            "xlsx", "xls",
            "csv", "txt", "md",
            "png", "jpg", "jpeg", "webp", "gif"
        ]
    },

    chunk: {
        size: 2000,    // characters, roughly 500 tokens
        overlap: 200
    },

    retrieval: {
        topK: 6
    },

    // Bounds the agentic loop so a model that keeps calling tools cannot burn
    // the Worker's CPU budget.
    maxToolIterations: 5,

    // Vectorize rejects oversized upsert batches; ingest in slices.
    upsertBatchSize: 50
};
