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

    :editing="dataGridConfig.editing"
    :toolbar="dataGridConfig.toolbar"
    
    :search-panel="dataGridConfig.searchPanel"
    :selection="dataGridConfig.selection"
    :paging="dataGridConfig.paging"
    :pager="dataGridConfig.pager"
  />
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { DxDataGrid } from 'devextreme-vue/data-grid';
import CustomStore from 'devextreme/data/custom_store';
import type { DataGridPropsConfig } from './type';
import { createDevExtremeCustomStore } from '../service';

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
  editing: {},
  toolbar: {},
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

const previewsSearchText = ref<string>("");

onBeforeMount(() => {
  dataGridConfig.value.remoteOperations = !Array.isArray(props.config.dataSource);
  if (Array.isArray(props.config.dataSource)) dataSource.value = props.config.dataSource;
  else dataSource.value = new createDevExtremeCustomStore().dataGrid(dataGridRef.value!, props.config.dataSource, { value: previewsSearchText.value, setter: (searchText: string) => previewsSearchText.value = searchText });
});

defineExpose({
  get instance() {
    return dataGridRef.value?.instance;
  }
});
</script>