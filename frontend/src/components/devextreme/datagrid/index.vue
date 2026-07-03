<template>
  <dx-data-grid
    ref="dataGridRef"
    height="100%" width="100%"
    
    v-bind="$attrs"
    :data-source="dataSource"
    :remote-operations="dataGridConfig.remoteOperations"

    :columns="dataGridConfig.columns"
    
    :hover-state-enabled="dataGridConfig.hoverStateEnabled"
    :column-auto-width="dataGridConfig.columnAutoWidth"
    :show-borders="dataGridConfig.showBorders"
    :show-column-lines="dataGridConfig.showColumnLines"
    :show-row-lines="dataGridConfig.showRowLines"
    :word-wrap-enabled="dataGridConfig.wordWrapEnabled"
    
    :search-panel="dataGridConfig.searchPanel"
    :selection="dataGridConfig.selection"
    :paging="dataGridConfig.paging"
    :pager="dataGridConfig.pager"
  />
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { DxDataGrid } from 'devextreme-vue/data-grid';
import CustomStore from 'devextreme/data/custom_store';
import type { DevExtremeDataGridApiDataSource, DataGridPropsConfig } from './type';

const { t } = useI18n();

const props = defineProps<{
  config: DataGridPropsConfig;
}>();

const emit = defineEmits([]);

const dataGridRef = ref<DxDataGrid>();

const dataSource = ref<CustomStore | any[]>([]);

const dataGridConfig = ref<DataGridPropsConfig>({
  remoteOperations: false,
  hoverStateEnabled: true,
  columnAutoWidth: true,
  showBorders: true,
  showColumnLines: true,
  showRowLines: true,
  wordWrapEnabled: true,
  paging: {
    pageSize: 20
  },
  pager: {
    showInfo: true,
    showNavigationButtons: true,
    // showPageSizeSelector: true,
    // allowedPageSizes: [20, 50, 100],
  },
  ...props.config
});

const oldSearchText = ref<string>("");

onBeforeMount(() => {
  dataGridConfig.value.remoteOperations = !Array.isArray(props.config.dataSource);
  dataSource.value = Array.isArray(props.config.dataSource) ? props.config.dataSource : new CustomStore({
    key: props.config.dataSource.key,
    load: async (loadOptions: any) => {
      const queryValues = {
        searchText: loadOptions.filter?.[0]?.[2],
        requireTotalCount: true,
        sort: loadOptions.sort,
        skip: loadOptions.skip,
        take: loadOptions.take
      };

      const totalCount = dataGridRef.value?.instance?.totalCount();
      const isTotalCountValid = typeof totalCount === "number" && totalCount > -1 && (queryValues.searchText ? queryValues.skip : !oldSearchText.value);

      queryValues.requireTotalCount = !isTotalCountValid;
      
      try {
        const response = await (props.config.dataSource as DevExtremeDataGridApiDataSource).api(queryValues);

        if(response.success) {
          oldSearchText.value = queryValues.searchText;
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
  });
});

defineExpose({
  get instance() {
    return dataGridRef.value?.instance;
  }
});
</script>