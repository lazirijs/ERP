import { Elysia } from "elysia";
import index from ".";
import categoriesRoute from "./categories/route";

export default new Elysia({ prefix: "/projects" })

.use(categoriesRoute)

// --- Create ---
.post("/", ({ body }) => index.db.create(body), index.schema.create.validation)

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