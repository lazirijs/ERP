import type { DxDataGrid } from "devextreme-vue";
import type { ApiResponse } from "@/api/type";

export type DevExtremeDataGridRemoteQueryFilter = {
  field: string;
  values?: any[] | null;
  searchText?: string | number | [number, number | null] | [Date, Date];
  type?: 'include' | 'exclude';
  operation?: 'contains' | 'notcontains' | 'startswith' | 'endswith' | 'between' | '=' | '<>' | '<' | '>' | '<=' | '>=';
}

export type DevExtremeDataGridRemoteQuery<T = {}> = {
  searchText?: string;
  requireTotalCount?: boolean;
  sort?: { selector: string; desc: boolean }[];
  skip?: number;
  take?: number;
  filters?: DevExtremeDataGridRemoteQueryFilter[];
  excludeColumnsFromSearchText?: string[];
} & T;

export interface DevExtremeDataGridRemoteDataFormat<T> {
  data: T[];
  totalCount: number;
  summary: any[];
  groupCount: number;
}

export interface DevExtremeDataGridApiDataSource {
  key: string;
  api: (query: DevExtremeDataGridRemoteQuery) => Promise<ApiResponse<DevExtremeDataGridRemoteDataFormat<any>>>;
  getByKey?: (key: string) => Promise<ApiResponse<any>>;
  map?: (data: any, index?: number) => any;
}

export type DataGridPropsConfig = Omit<DxDataGrid, 'dataSource'> & {
  dataSource: unknown[] | DevExtremeDataGridApiDataSource;
}

export type DataGridAppRef = {
  instance: DxDataGrid["instance"];
};

export type DevExtremeDataGridLookupLoadOptions = {
  searchExpr: string;
  searchOperation: string;
  searchValue: string;
  userData: any;
}