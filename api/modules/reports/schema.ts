import { t } from "elysia";

// Every report is scoped to a closed date range of calendar days ("YYYY-MM-DD").
// The db layer compares these against date(created_at), so callers never deal with
// the stored "YYYY-MM-DDTHH:MM:SSZ" shape.
const rangeQuery = t.Object({
    from: t.String({ minLength: 10, maxLength: 10, format: "date" }),
    to: t.String({ minLength: 10, maxLength: 10, format: "date" })
});

// --- Sales & profit ---

const salesReport = t.Object({
    kpis: t.Object({
        revenue: t.Number(),
        cogs: t.Number(),
        profit: t.Number(),
        margin: t.Number(),
        sales_count: t.Number(),
        items_sold: t.Number(),
        average_sale_value: t.Number()
    }),
    series: t.Array(t.Object({
        date: t.String(),
        revenue: t.Number(),
        cogs: t.Number(),
        profit: t.Number()
    })),
    top_products: t.Array(t.Object({
        uid: t.Nullable(t.String()),
        name: t.Nullable(t.String()),
        quantity: t.Number(),
        revenue: t.Number(),
        profit: t.Number()
    })),
    top_clients: t.Array(t.Object({
        uid: t.Nullable(t.String()),
        name: t.Nullable(t.String()),
        sales_count: t.Number(),
        revenue: t.Number()
    }))
});

// --- Cash & transactions ---

const cashReport = t.Object({
    kpis: t.Object({
        amount_in: t.Number(),
        amount_out: t.Number(),
        net: t.Number(),
        transactions_count: t.Number()
    }),
    series: t.Array(t.Object({
        date: t.String(),
        amount_in: t.Number(),
        amount_out: t.Number()
    })),
    accounts: t.Array(t.Object({
        uid: t.Nullable(t.String()),
        name: t.Nullable(t.String()),
        amount_in: t.Number(),
        amount_out: t.Number(),
        balance: t.Number()
    }))
});

// --- Inventory ---

const inventoryReport = t.Object({
    kpis: t.Object({
        products_count: t.Number(),
        stock_quantity: t.Number(),
        stock_value: t.Number(),
        out_of_stock_count: t.Number(),
        purchase_spend: t.Number()
    }),
    top_products: t.Array(t.Object({
        uid: t.String(),
        name: t.String(),
        quantity: t.Number(),
        stock_value: t.Number()
    })),
    suppliers: t.Array(t.Object({
        uid: t.Nullable(t.String()),
        name: t.Nullable(t.String()),
        purchases_count: t.Number(),
        amount: t.Number()
    }))
});

// --- HR / attendance ---

const hrReport = t.Object({
    kpis: t.Object({
        sessions_count: t.Number(),
        employees_count: t.Number(),
        present: t.Number(),
        absent: t.Number(),
        attendance_rate: t.Number()
    }),
    series: t.Array(t.Object({
        date: t.String(),
        present: t.Number(),
        absent: t.Number()
    })),
    teams: t.Array(t.Object({
        uid: t.Nullable(t.String()),
        name: t.Nullable(t.String()),
        present: t.Number(),
        absent: t.Number(),
        attendance_rate: t.Number()
    }))
});

export default {
    data: {
        range: rangeQuery,
        sales: salesReport,
        cash: cashReport,
        inventory: inventoryReport,
        hr: hrReport
    },
    sales: {
        validation: {
            auth: true,
            query: rangeQuery
        }
    },
    cash: {
        validation: {
            auth: true,
            query: rangeQuery
        }
    },
    inventory: {
        validation: {
            auth: true,
            query: rangeQuery
        }
    },
    hr: {
        validation: {
            auth: true,
            query: rangeQuery
        }
    }
};
