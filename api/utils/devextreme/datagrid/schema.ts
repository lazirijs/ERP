import { t } from "elysia";

const dataGridQuery = t.Object({
    take: t.Number({ default: 20, maximum: 100 }),
    skip: t.Number({ default: 0 }),
    requireTotalCount: t.Boolean({ default: false }),
    sort: t.Optional(t.Array(t.Object({
        selector: t.String(),
        desc: t.Boolean()
    }))),
    searchText: t.Optional(t.String({ default: "" })),
    filters: t.Optional(t.Array(t.Object({
        field: t.String(),
        values: t.Optional(t.Nullable(t.Array(t.Any()))),
        searchText: t.Optional(t.Union([
            t.String(),
            t.Number(),
            t.Tuple([t.Number(), t.Nullable(t.Number())]),
            t.Tuple([t.Date(), t.Date()])
        ])),
        type: t.Optional(t.Union([
            t.Literal("include"),
            t.Literal("exclude")
        ])),
        operation: t.Optional(t.Union([
            t.Literal("contains"),
            t.Literal("notcontains"),
            t.Literal("startswith"),
            t.Literal("endswith"),
            t.Literal("between"),
            t.Literal("="),
            t.Literal("<>"),
            t.Literal("<"),
            t.Literal(">"),
            t.Literal("<="),
            t.Literal(">="),
        ]))
    })))
});

const dataGridResponse = t.Object({
    data: t.Array(t.Any()),
    totalCount: t.Number(),
    summary: t.Any(),
    groupCount: t.Number()
});

export default {
    data: dataGridQuery,
    response: dataGridResponse
};