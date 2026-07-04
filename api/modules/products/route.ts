import { Elysia } from "elysia";
import index from ".";

export default new Elysia({ prefix: "/products" })

// --- Create ---
.post("/", ({ body }) => index.db.create(body), index.schema.create.validation)

// --- Get by uid ---
.get("/:uid", ({ params }) => index.db.getByUid(params.uid), index.schema.get.validation)

// --- Get all ---
.get("/", ({ query }) => index.db.getAll(query), index.schema.getAll.validation)

// --- Update ---
.put("/", ({ body }) => index.db.update(body), index.schema.update.validation)

// --- List images ---
.get("/:uid/images", ({ params }) => index.db.getImages(params.uid), index.schema.getImages.validation)

// --- Upload image ---
.post("/:uid/images", ({ params, query, body: { file } }) => index.db.uploadImage({ uid: params.uid, file, primary: query.primary }), index.schema.uploadImage.validation)

// --- Set primary image ---
.put("/:uid/images/primary", ({ params, body: { image } }) => index.db.setPrimary({ uid: params.uid, image }), index.schema.setPrimary.validation)

// --- Delete image ---
.delete("/:uid/images", ({ params, body: { image } }) => index.db.deleteImage({ uid: params.uid, image }), index.schema.deleteImage.validation)
