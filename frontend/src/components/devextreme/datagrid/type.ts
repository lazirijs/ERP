import type { DxDataGrid } from "devextreme-vue";
import type { ApiResponse } from "@/api/type";

export type DevExtremeDataGridRemoteQuery<T = {}> = {
  searchText: string;
  requireTotalCount: boolean;
  sort: [{ selector: string; desc: boolean }];
  skip: number;
  take: number;
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
}

export type DataGridPropsConfig = Omit<DxDataGrid, 'dataSource'> & {
  dataSource: unknown[] | DevExtremeDataGridApiDataSource;
}

export type DataGridAppRef = {
  instance: DxDataGrid["instance"];
};