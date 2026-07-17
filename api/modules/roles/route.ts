import { Elysia } from "elysia";
import index from ".";

export default new Elysia({ prefix: "/roles" })

// --- Create ---
.post("/", ({ body }) => index.db.create(body), index.schema.create.validation)

// --- Get by uid (includes assigned permission_uids) ---
.get("/:uid", ({ params }) => index.db.getByUid(params.uid), index.schema.get.validation)

// --- Get all ---
.get("/", ({ query }) => index.db.getAll(query), index.schema.getAll.validation)

// --- Update ---
.put("/", ({ body }) => index.db.update(body), index.schema.update.validation)

// --- Delete ---
.delete("/:uid", ({ params }) => index.db.delete(params.uid), index.schema.delete.validation)
