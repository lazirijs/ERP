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
    dataField: t.Optional(t.String())
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