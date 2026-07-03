import { Elysia } from "elysia";
import index from ".";
import itemsRoute from "./items/route";
import deliveriesRoute from "./deliveries/route";

export default new Elysia({ prefix: "/orders" })

.use(itemsRoute)
.use(deliveriesRoute)

// --- Create ---
.post("/", ({ body }) => index.db.create(body), index.schema.create.validation)

// --- Get by uid ---
.get("/:uid", ({ params }) => index.db.getByUid(params.uid), index.schema.get.validation)

// --- Get all ---
.get("/", ({ query }) => index.db.getAll(query), index.schema.getAll.validation)

// --- Update ---
.put("/", ({ body }) => index.db.update(body), index.schema.update.validation)