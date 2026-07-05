import { ElMessage } from "element-plus";
import CustomStore from 'devextreme/data/custom_store';
import type { DevExtremeDataGridApiDataSource, DevExtremeDataGridLookupLoadOptions } from './datagrid/type';
import { DxDataGrid } from 'devextreme-vue/data-grid';
import { t } from '@/translate';

export class createDevExtremeCustomStore {
    private createCustomStore(key: string, load: (loadOptions: any) => Promise<any>, more?: any) {
        return new CustomStore({ key, load, ...more });
    }

    public dataGrid(dataGridRef: DxDataGrid, dataSource: DevExtremeDataGridApiDataSource, searchText: { value: string, setter: (searchText: string) => void }) {
        return  this.createCustomStore(dataSource.key, async (loadOptions: any) => {
                const queryValues = {
                    searchText: loadOptions.filter?.[0]?.[2],
                    requireTotalCount: true,
                    sort: loadOptions.sort,
                    skip: loadOptions.skip,
                    take: loadOptions.take
                };

                const totalCount = dataGridRef?.instance?.totalCount();
                const isTotalCountValid = typeof totalCount === "number" && totalCount > -1 && (queryValues.searchText ? queryValues.skip : !searchText.value);

                queryValues.requireTotalCount = !isTotalCountValid;
                
                try {
                    const response = await dataSource.api(queryValues);

                    if(response.success) {
                        searchText.setter(queryValues.searchText);
                        if (isTotalCountValid) response.detail.totalCount = totalCount;
                        return response.detail;
                    }
                    const errorMessage = response?.detail?.message || t('failedToLoadUsers');
                    ElMessage.error(errorMessage);
                } catch (error: any) {
                    const errorMessage = error?.detail?.message || t('failedToLoadUsers');
                    ElMessage.error(errorMessage);
                }
            }
        );
    }

    public lookup(dataSource: DevExtremeDataGridApiDataSource, searchText: { value: string, setter: (searchText: string) => void }) {
        return this.createCustomStore(dataSource.key, async (loadOptions: DevExtremeDataGridLookupLoadOptions) => {
            const queryValues = {
                searchText: loadOptions.searchValue || '',
                requireTotalCount: true,
                sort: [],
                skip: 0,
                take: 20
            };
            
            const totalCount = -1; //dataGridRef?.instance?.totalCount();
            const isTotalCountValid = typeof totalCount === "number" && totalCount > -1 && (queryValues.searchText ? queryValues.skip : !searchText.value);

            queryValues.requireTotalCount = !isTotalCountValid;
            
            try {
                const response = await dataSource.api(queryValues);

                if(response.success) {
                    searchText.setter(queryValues.searchText);
                    if (isTotalCountValid) response.detail.totalCount = totalCount;
                    return response.detail;
                }
                const errorMessage = response?.detail?.message || t('failedToLoadUsers');
                ElMessage.error(errorMessage);
            } catch (error: any) {
                const errorMessage = error?.detail?.message || t('failedToLoadUsers');
                ElMessage.error(errorMessage);
            }
        });
    }
}