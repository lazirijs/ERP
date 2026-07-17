import { Elysia } from "elysia";
import index from ".";
import type { AuthPluginType } from "../auth/type";

// Cast to the auth plugin type so the `auth` macro is recognised on an auth-only route
// (one with no body/params/query schema), matching modules/auth/route.ts.
export default (new Elysia({ prefix: "/permissions" }) as unknown as AuthPluginType)

// --- Get all (full catalog) ---
.get("/", () => index.db.getAll(), index.schema.getAll.validation)
