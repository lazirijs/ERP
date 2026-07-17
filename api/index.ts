import { Elysia } from "elysia";
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { env } from 'cloudflare:workers'
import Responses from "./utils/response";
import Auth from './modules/auth'
import AuthRoute from "./modules/auth/route"
import UsersRoute from "./modules/users/route"
import RolesRoute from "./modules/roles/route"
import PermissionsRoute from "./modules/permissions/route"
import ClientsRoute from "./modules/clients/route"
import ProjectsRoute from "./modules/projects/route"
import StorageRoute from "./storage/route"
import TransactionsRoute from "./modules/transactions/route"
import AccountsRoute from "./modules/accounts/route"
import ProductsRoute from "./modules/products/route"
import SuppliersRoute from "./modules/suppliers/route"
import PurchasesRoute from "./modules/purchases/route"
import SalesRoute from "./modules/sales/route"
import EmployeesRoute from "./modules/employees/route"
import TeamsRoute from "./modules/teams/route"
import SessionsRoute from "./modules/sessions/route"
import ReportsRoute from "./modules/reports/route"
import AiRoute from "./modules/ai/route"
import ingest from "./modules/ai/ingest"
import type { IngestMessageType } from "./modules/ai/type"

const origin = env.CLIENT_ORIGIN!

const app = new Elysia({ adapter: CloudflareAdapter })

.use(cors({ origin, credentials: true }))
.use(openapi())

.use(Responses.plugin)

// --- Health check ---
.get("/", () => Responses.service.handler.success({
    message: "Server is running",
    origin
}))

.use(Auth.plugin)

.use(AuthRoute)
.use(UsersRoute)
.use(RolesRoute)
.use(PermissionsRoute)
.use(ClientsRoute)
.use(ProjectsRoute)
.use(StorageRoute)
.use(TransactionsRoute)
.use(AccountsRoute)
.use(ProductsRoute)
.use(SuppliersRoute)
.use(PurchasesRoute)
.use(SalesRoute)
.use(EmployeesRoute)
.use(TeamsRoute)
.use(SessionsRoute)
.use(ReportsRoute)
.use(AiRoute)

.compile();

// The Worker now serves two entry points: the Elysia app over HTTP, and the
// ingestion queue consumer. Document ingestion (extract -> chunk -> embed) is
// far too slow to run inside the upload request.
export default {
    fetch: (request: Request) => app.fetch(request),

    async queue(batch: MessageBatch<IngestMessageType>) {
        for (const message of batch.messages) {
            try {
                await ingest(message.body);
                message.ack();
            } catch (error) {
                console.log("Ingestion failed", message.body, error);
                // The file is already marked `failed` in files_index; retrying
                // covers transient AI/Vectorize errors.
                message.retry();
            }
        }
    }
};