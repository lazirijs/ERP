import { Elysia } from "elysia";
import index from ".";

export default new Elysia({ prefix: "/items" })

// --- Create ---
.post("/", ({ body }) => index.db.create(body), index.schema.create.validation)

// --- Create (batch, all into one purchase) ---
.post("/batch", ({ body }) => index.db.createBatch(body), index.schema.batch.validation)

// --- Get by uid ---
.get("/:uid", ({ params }) => index.db.getByUid(params.uid), index.schema.get.validation)

// --- Get all (optional purchase_uid filter) ---
.get("/", ({ query }) => index.db.getAll(query), index.schema.getAll.validation)

// --- Update ---
.put("/", ({ body }) => index.db.update(body), index.schema.update.validation)

// --- Delete ---
.delete("/:uid", ({ params }) => index.db.delete(params.uid), index.schema.delete.validation)
