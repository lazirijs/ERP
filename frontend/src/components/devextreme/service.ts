import { ElMessage } from "element-plus";
import CustomStore, { type Options } from 'devextreme/data/custom_store';
import type { DevExtremeDataGridApiDataSource, DevExtremeDataGridLookupLoadOptions, DevExtremeDataGridRemoteQuery } from './datagrid/type';
import { DxDataGrid } from 'devextreme-vue/data-grid';
import { t } from '@/translate';
import type { ApiResponse } from "@/api/type";

type CustomStoreOptions = Omit<Options, 'load' | 'key' | 'byKey'>;

export class createDevExtremeCustomStore {
    private createCustomStore(key: string, load: (loadOptions: any) => Promise<any>, byKey?: (key: string) => Promise<ApiResponse<any>>, customStoreOptions?: CustomStoreOptions) {
        return new CustomStore({ key, load, byKey, ...customStoreOptions });
    }

    public dataGrid(dataGridRef: () => DxDataGrid | undefined, dataSource: DevExtremeDataGridApiDataSource, searchText: { value: string, setter: (searchText: string) => void }) {
        return  this.createCustomStore(dataSource.key, async (loadOptions: any) => {
                const queryValues: DevExtremeDataGridRemoteQuery = {
                    searchText: dataGridRef()?.instance?.option("searchPanel.text") as string || "",
                    requireTotalCount: true,
                    sort: loadOptions.sort,
                    skip: loadOptions.skip,
                    take: loadOptions.take,
                    filters: [],
                    excludeColumnsFromSearchText: []
                };
                
                queryValues.excludeColumnsFromSearchText = dataGridRef()?.instance?.option("columns")?.filter((col: any) => col.visible === false).map((col: any) => col.dataField) || [];

                // console.log(loadOptions);
                // console.log(dataGridRef()?.instance?.getVisibleColumns()[5].filterValues);
                
                queryValues.filters = dataGridRef()?.instance?.getVisibleColumns().map(column => ({
                    field: column.dataField!,
                    values: column.filterValues!,
                    searchText: column.filterValue! ?? "",
                    type: column.filterType,
                    operation: column.selectedFilterOperation || (column as any).defaultFilterOperation
                })).filter(filter => filter.values?.length || filter.searchText != "" || filter.searchText != null || filter.searchText != undefined)!;

                // console.log(queryValues.filters);
                // console.log('dataGrid', loadOptions, queryValues);

                const totalCount = dataGridRef()?.instance?.totalCount();
                const isTotalCountValid = typeof totalCount === "number" && totalCount > -1 && (queryValues.searchText ? queryValues.skip : !(searchText.value || queryValues.searchText || queryValues.filters.length));

                queryValues.requireTotalCount = !isTotalCountValid;
                
                try {
                    const response = await dataSource.api(queryValues);

                    if(response.success) {
                        searchText.setter(queryValues.searchText!);
                        if (isTotalCountValid) response.detail.totalCount = totalCount;
                        return response.detail;
                    }
                    const errorMessage = response?.detail?.message || t('loadingFailed');
                    ElMessage.error(errorMessage);
                } catch (error: any) {
                    const errorMessage = error?.detail?.message || t('loadingFailed');
                    ElMessage.error(errorMessage);
                }
            }
        );
    }

    public lookup(dataSource: DevExtremeDataGridApiDataSource, customStoreOptions?: CustomStoreOptions) {
        return this.createCustomStore(
            dataSource.key,
            // Dropdown list: server-side fetch (searchValue is sent to the API when the user searches).
            async (loadOptions: DevExtremeDataGridLookupLoadOptions) => {
                const queryValues = {
                    searchText: loadOptions.searchValue || '',
                    requireTotalCount: false,
                    sort: [],
                    skip: 0,
                    take: 20
                };

                // console.log('lookup', loadOptions, queryValues);

                try {
                    const response = await dataSource.api(queryValues);
                    if(response.success) {
                        if (dataSource.map) response.detail.data = response.detail.data.map(dataSource.map);                        
                        return response.detail.data;
                    }
                    const errorMessage = response?.detail?.message || t('loadingFailed');
                    ElMessage.error(errorMessage);
                } catch (error: any) {
                    const errorMessage = error?.detail?.message || t('loadingFailed');
                    ElMessage.error(errorMessage);
                }
            },
            async key => {
                try {
                    if (!key || !dataSource.getByKey) return null;
                    const response = await dataSource.getByKey(key);
                    if(response.success) {
                        if (dataSource.map) response.detail.data = dataSource.map(response.detail.data);
                        return response.detail;
                    }
                    const errorMessage = response?.detail?.message || t('loadingFailed');
                    ElMessage.error(errorMessage);
                } catch (error: any) {
                    const errorMessage = error?.detail?.message || t('loadingFailed');
                    ElMessage.error(errorMessage);
                }
            },
            customStoreOptions
        );
    }
}