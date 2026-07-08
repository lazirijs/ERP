import { Elysia } from "elysia";
import index from ".";
import employeesRoute from "./employees/route";

export default new Elysia({ prefix: "/sessions" })

.use(employeesRoute)

// --- Create ---
.post("/", ({ body }) => index.db.create(body), index.schema.create.validation)

// --- Get by uid ---
.get("/:uid", ({ params }) => index.db.getByUid(params.uid), index.schema.get.validation)

// --- Get all (optional from/to date range) ---
.get("/", ({ query }) => index.db.getAll(query), index.schema.getAll.validation)

// --- Update ---
.put("/", ({ body }) => index.db.update(body), index.schema.update.validation)
