import { Elysia } from "elysia";
import index from ".";
import type { AuthPluginType } from "../auth/type";
import type { CallerType } from "./type";

/**
 * Single tenant for now: company_uid is fixed to the seeded row. When users gain
 * a real company, this is the only place that changes -- every table and every
 * vector already carries the field.
 */
const caller = (user: { uid: string }): CallerType => ({
    uid: user.uid,
    company_uid: index.constant.defaultCompanyUid
});

export default (new Elysia({ prefix: "/ai" }) as unknown as AuthPluginType)

// --- List documents ---
.get("/files", ({ user, query }) => index.db.getFiles(caller(user), query), index.schema.getFiles.validation)

// --- Upload a document ---
.post("/files", ({ user, query, body: { file } }) => index.db.uploadFile(caller(user), query, file), index.schema.uploadFile.validation)

// --- Delete a document ---
.delete("/files", ({ user, body: { uid } }) => index.db.deleteFile(caller(user), uid), index.schema.deleteFile.validation)

// --- List chat threads ---
.get("/threads", ({ user }) => index.db.getThreads(caller(user)), index.schema.getThreads.validation)

// --- New chat ---
.post("/threads", ({ user, body }) => index.db.createThread(caller(user), body.title), index.schema.createThread.validation)

// --- Delete a chat ---
.delete("/threads/:uid", ({ user, params }) => index.db.deleteThread(caller(user), params.uid), index.schema.deleteThread.validation)

// --- Load a chat ---
.get("/threads/:uid/messages", ({ user, params }) => index.db.getMessages(caller(user), params.uid), index.schema.getMessages.validation)

// --- Send a message (runs the agentic loop) ---
.post("/threads/:uid/messages", ({ user, params, body }) => index.db.sendMessage(caller(user), params.uid, body.content), index.schema.sendMessage.validation)

// --- Approve a proposed write ---
.post("/actions/:uid/confirm", ({ user, params }) => index.db.confirmAction(caller(user), params.uid), index.schema.action.validation)

// --- Decline a proposed write ---
.post("/actions/:uid/reject", ({ user, params }) => index.db.rejectAction(caller(user), params.uid), index.schema.action.validation)
