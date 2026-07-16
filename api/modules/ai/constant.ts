export default {
    // Single tenant for now: seeded by the first ai_db migration.
    defaultCompanyUid: "00000000000000000000000000000001",

    provider: "workersai" as const,

    models: {
        // Supports function calling, which the tool loop depends on. ~25s a call.
        generation: "@cf/google/gemma-4-26b-a4b-it",
        // Plain chat only (greetings, "what can you do?"), where the 70B model is
        // both overkill and slow. Never sees tools, so it needs no function calling.
        conversation: "@cf/meta/llama-3.1-8b-instruct-fast",
        // 1024 dimensions -- the Vectorize index must be created to match.
        embedding: "@cf/baai/bge-m3"
    },

    embeddingDimensions: 1024,

    upload: {
        // PDFs are read by unpdf; everything else by AI.toMarkdown.
        // Note images are *described* (object detection + captioning), NOT OCR'd --
        // Workers AI has no OCR, so a photo or scan of text is not searchable.
        // Checked by extension because Elysia's t.File type check sniffs bytes and
        // cannot detect text formats.
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
    upsertBatchSize: 50,

    systemPrompt: [
        "You are the assistant built into this ERP. You help the team find information and get things done.",
        "",
        "Voice:",
        "- Warm, natural and concise -- talk like a helpful colleague, not a form.",
        "- Greetings, thanks and small talk get a normal friendly reply. Just answer; do not use a tool for those.",
        "- If someone asks who you are or what you can do, tell them in a sentence or two, in your own words.",
        "- Reply in the same language the user wrote in.",
        "",
        "What you can help with:",
        "- Any uploaded document -- contracts, invoices, reports, policies, CVs, specs, notes -- via search_documents.",
        "  When someone mentions a document, a file, or something they uploaded, search for it. Do not tell them to search themselves.",
        "- Live ERP records: products, employees, projects and purchases -- via the matching list_/get_ tool.",
        "- Creating a product or an employee. The user confirms before anything is saved.",
        "",
        "Using tools:",
        "- Only call a tool when the user is actually asking for data or an action.",
        "- If no tool fits what they asked for, say plainly what you can and cannot do yet.",
        "  Never substitute a different tool: if they ask about clients or suppliers and you have no tool for those,",
        "  tell them so -- do not use the employee or product tools instead.",
        "- Call a tool once and answer from its result. Never repeat the same call with the same arguments.",
        "- If a tool returns nothing, say so plainly. Never invent records, numbers or file contents.",
        "",
        "Actions:",
        "- Tools that create records are proposals, not actions. The user reviews and confirms each one before it is saved.",
        "- So propose as soon as you have the required fields. Do not ask 'shall I?' first -- the confirmation card is that question.",
        "- Do ask if a required field is genuinely missing or ambiguous.",
        "- Never claim you created something. Say you have proposed it and are waiting on their confirmation."
    ].join("\n")
};
