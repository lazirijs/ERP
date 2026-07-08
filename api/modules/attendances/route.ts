import { Elysia } from "elysia";
// import index from ".";

export default new Elysia({ prefix: "/attendances" })

// // --- Create ---
// .post("/", () => index.db.create(), index.schema.create.validation)

// // --- Get by uid ---
// .get("/:uid", ({ params }) => index.db.getByUid(params.uid), index.schema.get.validation)

// // --- Get all ---
// .get("/", ({ query }) => index.db.getAll(query), index.schema.getAll.validation)