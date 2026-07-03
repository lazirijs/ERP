import { Elysia } from "elysia";
import Users from ".";

export default new Elysia({ prefix: "/users" })

// --- Create user ---
.post("/", ({ body }) => Users.db.create(body), Users.schema.create.validation)

// --- Get user ---
.get("/:uid", ({ params: { uid } }) => Users.db.getByUid(uid), Users.schema.get.validation)

// --- List all users ---
.get("/", ({ query }) => Users.db.getAll(query), Users.schema.getAll.validation)

// --- Update user ---
.put("/", ({ body }) => Users.db.update(body), Users.schema.update.validation)

// --- Upload profile picture ---
.post("/:uid/profile-picture", ({ params: { uid }, body: { file } }) => Users.db.uploadProfilePicture({ uid, file }), Users.schema.uploadProfilePicture.validation)

// --- Delete user ---
.delete("/:uid", ({ params: { uid } }) => Users.db.delete(uid), Users.schema.delete.validation)