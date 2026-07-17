import { Elysia } from "elysia";
import index from ".";

export default new Elysia({ prefix: "/reports" })

// --- Sales & profit ---
.get("/sales", ({ query }) => index.db.sales(query), index.schema.sales.validation)

// --- Cash & transactions ---
.get("/cash", ({ query }) => index.db.cash(query), index.schema.cash.validation)

// --- Inventory ---
.get("/inventory", ({ query }) => index.db.inventory(query), index.schema.inventory.validation)

// --- HR / attendance ---
.get("/hr", ({ query }) => index.db.hr(query), index.schema.hr.validation)
