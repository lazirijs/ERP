import { t } from "elysia";
import Products from "../../products";
import Employees from "../../employees";
import Projects from "../../projects";
import Purchases from "../../purchases";
import type { Tool } from "./type";
import type { DataGridQuery } from "../../../utils/devextreme/datagrid/type";

/**
 * Read tools get this small hand-written schema rather than reusing
 * DataGridSchema. The DevExtreme query is a filter DSL (nested filters,
 * operations, tuples) built for the grid -- handing it to a model produces
 * malformed queries far more often than useful ones. The *service* underneath
 * is still the same `getAll` the HTTP route calls.
 *
 * Write tools are the opposite: they reuse the module's createBody verbatim,
 * because that is where a schema drifting out of sync causes real damage.
 */
const listBody = t.Object({
    searchText: t.Optional(t.String({ maxLength: 100 })),
    take: t.Optional(t.Number({ minimum: 1, maximum: 50 }))
});

type ListBody = typeof listBody.static;

const toDataGridQuery = ({ searchText, take }: ListBody): DataGridQuery => ({
    take: take ?? 10,
    skip: 0,
    requireTotalCount: true,
    searchText: searchText ?? ""
});

const uidBody = t.Object({
    uid: t.String({ minLength: 1 })
});

const listTools: Tool[] = [
    {
        name: "list_products",
        description:
            "Search or list products, returning name, price, quantity in stock and description. " +
            "Call this when the user asks what products exist, how many there are, stock levels, or a product's price. " +
            "Omit searchText to list everything.",
        schema: listBody,
        kind: "read",
        execute: async (input: ListBody) => (await Products.db.getAll(toDataGridQuery(input))).detail
    },
    {
        name: "list_employees",
        description:
            "Search or list employees, returning name, status and team. " +
            "Call this when the user asks who works here, how many employees there are, who is on a team, or who is on vacation. " +
            "Status values: 0 = active, 1 = inactive, 2 = on vacation, 3 = left. Omit searchText to list everyone.",
        schema: listBody,
        kind: "read",
        execute: async (input: ListBody) => (await Employees.db.getAll(toDataGridQuery(input))).detail
    },
    {
        name: "list_projects",
        description:
            "Search or list projects. Call this when the user asks which projects exist, their status, or details of a named project.",
        schema: listBody,
        kind: "read",
        execute: async (input: ListBody) => (await Projects.db.getAll(toDataGridQuery(input))).detail
    },
    {
        name: "list_purchases",
        description:
            "Search or list purchases. Call this when the user asks about purchase orders, what was bought, or spend with a supplier.",
        schema: listBody,
        kind: "read",
        execute: async (input: ListBody) => (await Purchases.db.getAll(toDataGridQuery(input))).detail
    },
    {
        name: "get_product",
        description: "Fetch one product by its uid. Call this only when you already know the uid, usually from list_products.",
        schema: uidBody,
        kind: "read",
        execute: async ({ uid }: typeof uidBody.static) => (await Products.db.getByUid(uid)).detail
    },
    {
        name: "get_employee",
        description: "Fetch one employee by their uid. Call this only when you already know the uid, usually from list_employees.",
        schema: uidBody,
        kind: "read",
        execute: async ({ uid }: typeof uidBody.static) => (await Employees.db.getByUid(uid)).detail
    }
];

const writeTools: Tool[] = [
    {
        name: "create_product",
        description:
            "Create a new product. Call this when the user asks to add, create or register a product. " +
            "The user must confirm before it is saved, so propose the call as soon as you have a name and price.",
        // Reused verbatim -- cannot drift from POST /products.
        schema: Products.schema.create.validation.body,
        kind: "write",
        summary: (input) => `Create product "${ input.name }" priced at ${ input.price }`,
        execute: async (input) => (await Products.db.create(input)).detail
    },
    {
        name: "create_employee",
        description:
            "Create a new employee. Call this when the user asks to add, hire or register an employee. " +
            "status must be one of: 0 = active, 1 = inactive, 2 = on vacation, 3 = left -- use 0 unless the user says otherwise. " +
            "team_uid must be null unless the user names a team you have already looked up. " +
            "The user must confirm before it is saved.",
        // Reused verbatim -- cannot drift from POST /employees.
        schema: Employees.schema.create.validation.body,
        kind: "write",
        summary: (input) => `Create employee "${ input.name }"`,
        execute: async (input) => (await Employees.db.create(input)).detail
    }
];

export default [...listTools, ...writeTools];
