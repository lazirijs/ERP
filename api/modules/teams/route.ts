import { Elysia } from "elysia";
import index from ".";

export default new Elysia({ prefix: "/teams" })

// --- Create ---
.post("/", ({ body }) => index.service.create(body), index.schema.create.validation)

// --- Get by uid ---
.get("/:uid", ({ params }) => index.db.getByUid(params.uid), index.schema.get.validation)

// --- Get all ---
.get("/", ({ query }) => index.db.getAll(query), index.schema.getAll.validation)

// --- Update ---
.put("/", ({ body }) => index.db.update(body), index.schema.update.validation)