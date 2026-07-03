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