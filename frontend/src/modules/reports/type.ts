export interface ReportRange {
  from: string;
  to: string;
}

export interface SalesReport {
  kpis: {
    revenue: number;
    cogs: number;
    profit: number;
    margin: number;
    sales_count: number;
    items_sold: number;
    average_sale_value: number;
  };
  series: { date: string; revenue: number; cogs: number; profit: number }[];
  top_products: { uid: string | null; name: string | null; quantity: number; revenue: number; profit: number }[];
  top_clients: { uid: string | null; name: string | null; sales_count: number; revenue: number }[];
}

export interface CashReport {
  kpis: {
    amount_in: number;
    amount_out: number;
    net: number;
    transactions_count: number;
  };
  series: { date: string; amount_in: number; amount_out: number }[];
  accounts: { uid: string | null; name: string | null; amount_in: number; amount_out: number; balance: number }[];
}

export interface InventoryReport {
  kpis: {
    products_count: number;
    stock_quantity: number;
    stock_value: number;
    out_of_stock_count: number;
    purchase_spend: number;
  };
  top_products: { uid: string; name: string; quantity: number; stock_value: number }[];
  suppliers: { uid: string | null; name: string | null; purchases_count: number; amount: number }[];
}

export interface HrReport {
  kpis: {
    sessions_count: number;
    employees_count: number;
    present: number;
    absent: number;
    attendance_rate: number;
  };
  series: { date: string; present: number; absent: number }[];
  teams: { uid: string | null; name: string | null; present: number; absent: number; attendance_rate: number }[];
}
