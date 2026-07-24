// Reverse-proxy every /api/* request to the erp-api Worker over a service binding
// (worker-to-worker, no public round trip). This keeps the browser talking to a single
// origin (laziri-erp.pages.dev), so the auth cookie is FIRST-PARTY and survives browsers
// that block third-party cookies — which the previous cross-site *.pages.dev -> *.workers.dev
// setup did not. It also means CORS never applies, since the Worker is called server-side.
//
// The `API` binding is declared in frontend/wrangler.jsonc (service: erp-api). Requests come
// in as /api/<path>; we strip the /api prefix so the Worker sees the route it actually defines
// (e.g. /auth/login, /file/...), preserving method, headers, body and query string.

interface Env {
  API: { fetch: (request: Request) => Promise<Response> };
}

export const onRequest = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;

  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, "") || "/";

  return env.API.fetch(new Request(url.toString(), request));
};
