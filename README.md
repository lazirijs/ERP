# ERP

A modular, full-stack **Enterprise Resource Planning** platform covering finance, HR, sales, projects, and CRM. The system is split into a Cloudflare Workers API backend and a Vue 3 web frontend.

## Architecture

```
default/
├── api/         # Backend  — Elysia on Cloudflare Workers (D1 + R2), TypeScript/Bun
└── frontend/    # Frontend — Vue 3 + Vite, Element Plus + DevExtreme
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| **API framework** | [Elysia](https://elysiajs.com) on **Cloudflare Workers** (via Wrangler) |
| **Runtime** | Bun (dev) / Workers runtime (prod) with `nodejs_compat` |
| **Database** | Cloudflare **D1** (SQLite) with SQL migrations |
| **File storage** | Cloudflare **R2** (`storage` bucket) |
| **Auth** | JWT (`@elysiajs/jwt`) |
| **API docs** | OpenAPI (`@elysiajs/openapi`) |
| **Frontend framework** | **Vue 3** (`<script setup>`) + TypeScript |
| **Build tool** | Vite |
| **UI** | Element Plus, DevExtreme (data grids), Tailwind CSS v4 |
| **State / routing / i18n** | Pinia, Vue Router, vue-i18n |
| **HTTP client** | Axios |

## Business modules

Both the API and frontend are organized around the same domains:

| Module | Responsibility |
|--------|----------------|
| `auth`, `users`, `roles` | Authentication and role-based access control |
| `clients`, `suppliers` | Customer (CRM) and vendor (SRM) management |
| `employees`, `teams`, `attendances sessions` | HR — staff records, team structure, attendance tracking |
| `projects` | Project management |
| `orders`, `sales` | Order processing (with deliveries & line items) and sales |
| `products` | Product / inventory catalog |
| `accounts`, `transactions` | Finance and accounting |
| `parameters` | System configuration |

Each API module follows a consistent structure: `route.ts` (HTTP routes), `service.ts` (business logic), `db.ts` (data access), `schema.ts` (validation), `type.ts`, and `plugin.ts`.

## Getting started

### Prerequisites

Before you start, install the following tools on your machine:

| Tool | Used for | Install |
|------|----------|---------|
| **[Node.js](https://nodejs.org)** (LTS) | Frontend runtime & tooling | Download the installer, or `winget install OpenJS.NodeJS.LTS` |
| **[Bun](https://bun.sh)** | API runtime, package manager & scripts | `powershell -c "irm bun.sh/install.ps1 \| iex"` (Windows) · `curl -fsSL https://bun.sh/install \| bash` (macOS/Linux) |
| **[pnpm](https://pnpm.io)** | Frontend package manager | `npm install -g pnpm` (after Node.js), or `corepack enable pnpm` |
| **Cloudflare account + Wrangler** | API deploy, D1 database, R2 storage | Installed with the API deps; run `wrangler login` to authenticate |

> Verify each install: `node -v`, `bun -v`, `pnpm -v`.

### Backend (`api/`)

```bash
cd api && bun i

# Apply database migrations locally
bun db:migration:local

# Start the local dev server (Wrangler)
bun dev
```

Useful scripts:

| Script | Purpose |
|--------|---------|
| `bun dev` | Local development (`wrangler dev`) |
| `bun run deploy` | Deploy to Cloudflare (`wrangler deploy`) |
| `bun db:migration:create` | Create a new D1 migration |
| `bun db:migration:local` | Apply migrations to the local D1 database |
| `bun db:migration:remote` | Apply migrations to the remote D1 database |
| `bun db:pull` | Export the remote D1 database and seed it locally |

**Configuration** lives in `api/wrangler.jsonc`:
- `db` — D1 database binding (`database/migrations/`)
- `storage` — R2 bucket binding
- `CLIENT_ORIGIN` — allowed CORS origin for the frontend
- `JWT_SECRET` — store as a Wrangler **secret**, not a plaintext var

Run `wrangler types` after changing any bindings in `wrangler.jsonc`.

### Frontend (`frontend/`)

```bash
cd frontend && pnpm i

# start the Vite dev server
pnpm dev
```

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Type-check (`vue-tsc`) and build for production |
| `pnpm preview` | Preview the production build |

The `@` alias resolves to `frontend/src`.

## Deployment

- **API** deploys to Cloudflare Workers via `bun run deploy`, using the D1 database and R2 bucket defined in `wrangler.jsonc`.
- **Frontend** builds to static assets (`pnpm build`) and is hosted on Cloudflare Pages.

Make sure the deployed frontend origin matches `CLIENT_ORIGIN` in the API config so CORS requests succeed.
