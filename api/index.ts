import { Elysia } from "elysia";
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { env } from 'cloudflare:workers'
import Responses from "./utils/response";
import Auth from './modules/auth'
import AuthRoute from "./modules/auth/route"
import UsersRoute from "./modules/users/route"
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

const origin = env.CLIENT_ORIGIN!

export default new Elysia({ adapter: CloudflareAdapter })

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

.compile();