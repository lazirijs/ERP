import { Elysia } from "elysia";
import index from ".";
import itemsRoute from "./items/route";

export default new Elysia({ prefix: "/purchases" })

.use(itemsRoute)

// --- Create (single) ---
.post("/", ({ body }) => index.db.create(body), index.schema.create.validation)

// --- Create (batch → one purchase per supplier group) ---
.post("/batch", ({ body }) => index.db.createBatch(body), index.schema.batch.validation)

// --- Get by uid ---
.get("/:uid", ({ params }) => index.db.getByUid(params.uid), index.schema.get.validation)

// --- Get all ---
.get("/", ({ query }) => index.db.getAll(query), index.schema.getAll.validation)

// --- Update ---
.put("/", ({ body }) => index.db.update(body), index.schema.update.validation)

// --- List documents ---
.get("/:uid/documents", ({ params }) => index.db.getDocuments(params.uid), index.schema.getDocuments.validation)

// --- Upload document ---
.post("/:uid/documents", ({ params, body: { file } }) => index.db.uploadDocument({ uid: params.uid, file }), index.schema.uploadDocument.validation)

// --- Delete document ---
.delete("/:uid/documents", ({ params, body: { document } }) => index.db.deleteDocument({ uid: params.uid, document }), index.schema.deleteDocument.validation)
