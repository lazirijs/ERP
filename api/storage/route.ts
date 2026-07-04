import { Elysia } from "elysia";
import storage from ".";
import type { AuthPluginType } from "../modules/auth/type";

export default (new Elysia() as unknown as AuthPluginType)

// --- Load a stored file by its full key (supports nested keys, e.g. products/{uid}/{imageId}.ext) ---
.get("/file/*", async ({ params, set }) => {
    try {
        const key = (params as Record<string, string | undefined>)["*"] ?? "";
        const file = key ? await storage.get(key) : null;

        if (!file) return set.status = 404, { message: "File not found in storage" };

        // Apply R2 metadata directly into Elysia headers
        const headers = new Headers();
        file.writeHttpMetadata(headers);
        set.headers = headers as unknown as Record<string, string | number>;
        set.headers["etag"] = file.httpEtag;

        // Return body directly (no Response object)
        return new Response(file.body);
    } catch (error: any) {
        console.log(error);
        return set.status = 500, { message: error.message || "Internal server error", ...error };
    }
}, { auth: true })