import api from "@/api";
import formatter from '@/services/formatter';
import type { ApiResponse } from "@/api/type";
import type { ReportRange, SalesReport, CashReport, InventoryReport, HrReport } from "@/modules/reports/type";

const endpoint = '/reports';

const fetchReport = async <T>(name: string, range: ReportRange) => {
  try {
    const queryString = formatter.stringifyForUrlQuery({ ...range });
    const response = await api.get<ApiResponse<T>>(`${endpoint}/${name}?${queryString}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const sales = (range: ReportRange) => fetchReport<SalesReport>('sales', range);

export const cash = (range: ReportRange) => fetchReport<CashReport>('cash', range);

export const inventory = (range: ReportRange) => fetchReport<InventoryReport>('inventory', range);

export const hr = (range: ReportRange) => fetchReport<HrReport>('hr', range);

export default { sales, cash, inventory, hr }
