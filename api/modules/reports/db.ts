import database from '../../database'
import Responses from '../../utils/response';
import type { SuccessServiceResponse } from '../../utils/response/type';
import type { ReportRangeQueryType, SalesReportType, CashReportType, InventoryReportType, HrReportType } from './type';

// Reports are read-only aggregations. Each endpoint issues its queries through a single
// database.batch() so a dashboard panel costs one round trip instead of one per widget.
//
// Two conventions hold throughout:
//   - Ranges are inclusive calendar days, matched with date(created_at) BETWEEN ? AND ?,
//     so callers pass "YYYY-MM-DD" and never think about the stored timestamp format.
//   - Only COMPLETED sales (status = 1) carry profit, because sale_items.cost is frozen
//     at completion (see modules/sales/db.ts completeSale). Pending sales have cost = 0,
//     and counting them would report their full revenue as profit.

const rows = <T>(result: any): T[] => (result?.results ?? []) as T[];
const row = <T>(result: any): T => ((result?.results ?? [])[0] ?? {}) as T;

// SQLite returns NULL for SUM over zero rows and for absent CASE branches; every metric
// is coerced so the API always answers with a number.
const num = (value: any): number => Number(value ?? 0);

// Percentages are only meaningful against a non-zero base — a period with no revenue has
// no margin, and reporting 0% would imply "sold at cost" rather than "sold nothing".
const rate = (part: number, whole: number): number =>
    whole > 0 ? Math.round((part / whole) * 10000) / 100 : 0;

export default {
    async sales(input: ReportRangeQueryType): Promise<SuccessServiceResponse<SalesReportType>> {
        try {
            const { from, to } = input;

            const completedInRange = `
                FROM sales s
                JOIN sale_items si ON si.sale_uid = s.uid
                WHERE s.status = 1 AND date(s.created_at) BETWEEN ? AND ?
            `;

            const [kpisResult, seriesResult, productsResult, clientsResult] = await database.batch([
                database.prepare(`
                    SELECT
                        COUNT(DISTINCT s.uid)                        AS sales_count,
                        COALESCE(SUM(si.price * si.quantity), 0)     AS revenue,
                        COALESCE(SUM(si.cost * si.quantity), 0)      AS cogs,
                        COALESCE(SUM(si.quantity), 0)                AS items_sold
                    ${ completedInRange }
                `).bind(from, to),

                database.prepare(`
                    SELECT
                        date(s.created_at)                           AS date,
                        COALESCE(SUM(si.price * si.quantity), 0)     AS revenue,
                        COALESCE(SUM(si.cost * si.quantity), 0)      AS cogs
                    ${ completedInRange }
                    GROUP BY date(s.created_at)
                    ORDER BY date ASC
                `).bind(from, to),

                database.prepare(`
                    SELECT
                        p.uid                                                AS uid,
                        p.name                                               AS name,
                        COALESCE(SUM(si.quantity), 0)                        AS quantity,
                        COALESCE(SUM(si.price * si.quantity), 0)             AS revenue,
                        COALESCE(SUM((si.price - si.cost) * si.quantity), 0) AS profit
                    FROM sale_items si
                    JOIN sales s ON s.uid = si.sale_uid
                    LEFT JOIN products p ON p.uid = si.product_uid
                    WHERE s.status = 1 AND date(s.created_at) BETWEEN ? AND ?
                    GROUP BY si.product_uid
                    ORDER BY revenue DESC
                    LIMIT 5
                `).bind(from, to),

                database.prepare(`
                    SELECT
                        c.uid                                        AS uid,
                        c.name                                       AS name,
                        COUNT(DISTINCT s.uid)                        AS sales_count,
                        COALESCE(SUM(si.price * si.quantity), 0)     AS revenue
                    FROM sales s
                    JOIN sale_items si ON si.sale_uid = s.uid
                    LEFT JOIN clients c ON c.uid = s.client_uid
                    WHERE s.status = 1 AND s.client_uid IS NOT NULL AND date(s.created_at) BETWEEN ? AND ?
                    GROUP BY s.client_uid
                    ORDER BY revenue DESC
                    LIMIT 5
                `).bind(from, to)
            ]);

            const kpi = row<any>(kpisResult);
            const revenue = num(kpi.revenue);
            const cogs = num(kpi.cogs);
            const salesCount = num(kpi.sales_count);

            return Responses.service.handler.success({
                kpis: {
                    revenue,
                    cogs,
                    profit: revenue - cogs,
                    margin: rate(revenue - cogs, revenue),
                    sales_count: salesCount,
                    items_sold: num(kpi.items_sold),
                    average_sale_value: salesCount > 0 ? Math.round((revenue / salesCount) * 100) / 100 : 0
                },
                series: rows<any>(seriesResult).map(i => ({
                    date: i.date,
                    revenue: num(i.revenue),
                    cogs: num(i.cogs),
                    profit: num(i.revenue) - num(i.cogs)
                })),
                top_products: rows<any>(productsResult).map(i => ({
                    uid: i.uid ?? null,
                    name: i.name ?? null,
                    quantity: num(i.quantity),
                    revenue: num(i.revenue),
                    profit: num(i.profit)
                })),
                top_clients: rows<any>(clientsResult).map(i => ({
                    uid: i.uid ?? null,
                    name: i.name ?? null,
                    sales_count: num(i.sales_count),
                    revenue: num(i.revenue)
                }))
            });
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async cash(input: ReportRangeQueryType): Promise<SuccessServiceResponse<CashReportType>> {
        try {
            const { from, to } = input;

            const [kpisResult, seriesResult, accountsResult] = await database.batch([
                database.prepare(`
                    SELECT
                        COALESCE(SUM(CASE WHEN type = '+' THEN amount END), 0) AS amount_in,
                        COALESCE(SUM(CASE WHEN type = '-' THEN amount END), 0) AS amount_out,
                        COUNT(*)                                               AS transactions_count
                    FROM transactions
                    WHERE date(created_at) BETWEEN ? AND ?
                `).bind(from, to),

                database.prepare(`
                    SELECT
                        date(created_at)                                       AS date,
                        COALESCE(SUM(CASE WHEN type = '+' THEN amount END), 0) AS amount_in,
                        COALESCE(SUM(CASE WHEN type = '-' THEN amount END), 0) AS amount_out
                    FROM transactions
                    WHERE date(created_at) BETWEEN ? AND ?
                    GROUP BY date(created_at)
                    ORDER BY date ASC
                `).bind(from, to),

                // in/out are range-scoped, but balance is deliberately all-time: an account's
                // balance is the running total of everything it has ever seen, not of the
                // window being reported on.
                database.prepare(`
                    SELECT
                        a.uid  AS uid,
                        a.name AS name,
                        COALESCE(SUM(CASE WHEN t.type = '+' AND date(t.created_at) BETWEEN ? AND ? THEN t.amount END), 0) AS amount_in,
                        COALESCE(SUM(CASE WHEN t.type = '-' AND date(t.created_at) BETWEEN ? AND ? THEN t.amount END), 0) AS amount_out,
                        COALESCE(SUM(CASE WHEN t.type = '+' THEN t.amount ELSE -t.amount END), 0)                         AS balance
                    FROM accounts a
                    LEFT JOIN transactions t ON t.account_uid = a.uid
                    GROUP BY a.uid
                    ORDER BY balance DESC
                `).bind(from, to, from, to)
            ]);

            const kpi = row<any>(kpisResult);
            const amountIn = num(kpi.amount_in);
            const amountOut = num(kpi.amount_out);

            return Responses.service.handler.success({
                kpis: {
                    amount_in: amountIn,
                    amount_out: amountOut,
                    net: amountIn - amountOut,
                    transactions_count: num(kpi.transactions_count)
                },
                series: rows<any>(seriesResult).map(i => ({
                    date: i.date,
                    amount_in: num(i.amount_in),
                    amount_out: num(i.amount_out)
                })),
                accounts: rows<any>(accountsResult).map(i => ({
                    uid: i.uid ?? null,
                    name: i.name ?? null,
                    amount_in: num(i.amount_in),
                    amount_out: num(i.amount_out),
                    balance: num(i.balance)
                }))
            });
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async inventory(input: ReportRangeQueryType): Promise<SuccessServiceResponse<InventoryReportType>> {
        try {
            const { from, to } = input;

            // Stock has two distinct meanings here, and they are not interchangeable:
            //   - products.quantity is on-hand stock, decremented by triggers the moment a
            //     sale line is added (see migration 0013), so it already reflects pending sales.
            //   - purchase_items.quantity - sold_quantity is un-consumed FIFO lot capacity,
            //     which only advances when a sale is completed.
            // Value is priced off the lots because only those carry a cost basis.
            const [stockResult, lotsResult, spendResult, productsResult, suppliersResult] = await database.batch([
                database.prepare(`
                    SELECT
                        COUNT(*)                                          AS products_count,
                        COALESCE(SUM(quantity), 0)                        AS stock_quantity,
                        COALESCE(SUM(CASE WHEN quantity <= 0 THEN 1 END), 0) AS out_of_stock_count
                    FROM products
                `),

                database.prepare(`
                    SELECT COALESCE(SUM((quantity - sold_quantity) * price), 0) AS stock_value
                    FROM purchase_items
                `),

                database.prepare(`
                    SELECT COALESCE(SUM(pi.price * pi.quantity), 0) AS purchase_spend
                    FROM purchase_items pi
                    JOIN purchases p ON p.uid = pi.purchase_uid
                    WHERE date(p.created_at) BETWEEN ? AND ?
                `).bind(from, to),

                database.prepare(`
                    SELECT
                        p.uid                                                             AS uid,
                        p.name                                                            AS name,
                        p.quantity                                                        AS quantity,
                        COALESCE(SUM((pi.quantity - pi.sold_quantity) * pi.price), 0)     AS stock_value
                    FROM products p
                    LEFT JOIN purchase_items pi ON pi.product_uid = p.uid
                    GROUP BY p.uid
                    ORDER BY stock_value DESC
                    LIMIT 5
                `),

                database.prepare(`
                    SELECT
                        s.uid                                          AS uid,
                        s.name                                         AS name,
                        COUNT(DISTINCT p.uid)                          AS purchases_count,
                        COALESCE(SUM(pi.price * pi.quantity), 0)       AS amount
                    FROM purchases p
                    LEFT JOIN suppliers s ON s.uid = p.supplier_uid
                    LEFT JOIN purchase_items pi ON pi.purchase_uid = p.uid
                    WHERE date(p.created_at) BETWEEN ? AND ?
                    GROUP BY p.supplier_uid
                    ORDER BY amount DESC
                    LIMIT 5
                `).bind(from, to)
            ]);

            const stock = row<any>(stockResult);

            return Responses.service.handler.success({
                kpis: {
                    products_count: num(stock.products_count),
                    stock_quantity: num(stock.stock_quantity),
                    stock_value: num(row<any>(lotsResult).stock_value),
                    out_of_stock_count: num(stock.out_of_stock_count),
                    purchase_spend: num(row<any>(spendResult).purchase_spend)
                },
                top_products: rows<any>(productsResult).map(i => ({
                    uid: i.uid,
                    name: i.name,
                    quantity: num(i.quantity),
                    stock_value: num(i.stock_value)
                })),
                suppliers: rows<any>(suppliersResult).map(i => ({
                    uid: i.uid ?? null,
                    name: i.name ?? null,
                    purchases_count: num(i.purchases_count),
                    amount: num(i.amount)
                }))
            });
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    },

    async hr(input: ReportRangeQueryType): Promise<SuccessServiceResponse<HrReportType>> {
        try {
            const { from, to } = input;

            // session_employees.status: 0 = present, 1 = absent (migration 0016).
            // sessions.date is already a plain "YYYY-MM-DD", so it compares directly.
            const attendance = `
                FROM session_employees se
                JOIN sessions s ON s.uid = se.session_uid
                WHERE s.date BETWEEN ? AND ?
            `;

            const [kpisResult, seriesResult, teamsResult] = await database.batch([
                database.prepare(`
                    SELECT
                        COUNT(DISTINCT se.session_uid)                    AS sessions_count,
                        COUNT(DISTINCT se.employee_uid)                   AS employees_count,
                        COALESCE(SUM(CASE WHEN se.status = 0 THEN 1 END), 0) AS present,
                        COALESCE(SUM(CASE WHEN se.status = 1 THEN 1 END), 0) AS absent
                    ${ attendance }
                `).bind(from, to),

                database.prepare(`
                    SELECT
                        s.date                                            AS date,
                        COALESCE(SUM(CASE WHEN se.status = 0 THEN 1 END), 0) AS present,
                        COALESCE(SUM(CASE WHEN se.status = 1 THEN 1 END), 0) AS absent
                    ${ attendance }
                    GROUP BY s.date
                    ORDER BY date ASC
                `).bind(from, to),

                database.prepare(`
                    SELECT
                        te.uid                                            AS uid,
                        te.name                                           AS name,
                        COALESCE(SUM(CASE WHEN se.status = 0 THEN 1 END), 0) AS present,
                        COALESCE(SUM(CASE WHEN se.status = 1 THEN 1 END), 0) AS absent
                    FROM session_employees se
                    JOIN sessions s ON s.uid = se.session_uid
                    LEFT JOIN teams te ON te.uid = se.team_uid
                    WHERE s.date BETWEEN ? AND ?
                    GROUP BY se.team_uid
                    ORDER BY present DESC
                `).bind(from, to)
            ]);

            const kpi = row<any>(kpisResult);
            const present = num(kpi.present);
            const absent = num(kpi.absent);

            return Responses.service.handler.success({
                kpis: {
                    sessions_count: num(kpi.sessions_count),
                    employees_count: num(kpi.employees_count),
                    present,
                    absent,
                    attendance_rate: rate(present, present + absent)
                },
                series: rows<any>(seriesResult).map(i => ({
                    date: i.date,
                    present: num(i.present),
                    absent: num(i.absent)
                })),
                teams: rows<any>(teamsResult).map(i => {
                    const teamPresent = num(i.present);
                    const teamAbsent = num(i.absent);
                    return {
                        uid: i.uid ?? null,
                        name: i.name ?? null,
                        present: teamPresent,
                        absent: teamAbsent,
                        attendance_rate: rate(teamPresent, teamPresent + teamAbsent)
                    };
                })
            });
        } catch (error) {
            if (Responses.schema.data.check(error)) throw error;
            throw Responses.service.handler.error(error);
        }
    }
}
