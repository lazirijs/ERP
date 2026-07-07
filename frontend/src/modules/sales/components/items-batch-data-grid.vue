<template>
  <data-grid-app
    ref="itemsDataGridRef"
    key-expr="__id"
    height="55vh"
    :config="itemsDataGridConfig"
    @init-new-row="onInitNewRow"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ProductApi from '@/modules/products/api';
import { createDevExtremeCustomStore } from '@/components/devextreme/service';
import DataGridApp from '@/components/devextreme/datagrid/index.vue';
import type { DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';
import { previewImage } from '@/services/files';

const { t } = useI18n();

const devExtremeCustomStore = new createDevExtremeCustomStore();

const itemsDataGridRef = ref<InstanceType<typeof DataGridApp>>();

const itemsDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: [],
  columns: [
    {
      dataField: 'product_uid',
      caption: t('product'),
      minWidth: 160,
      lookup: {
        dataSource: devExtremeCustomStore.lookup({ key: 'uid', api: ProductApi.getAll, getByKey: ProductApi.get }),
        valueExpr: 'uid',
        displayExpr: 'name'
      },
      validationRules: [{ type: 'required' }],
      // Fetch the selected product so the image column can preview it
      setCellValue(newData: any, value: any) {
        newData.product_uid = value;
        newData.image = '';
        if (value) return ProductApi.get(value).then((res) => {
newData.image = res.detail.image;
newData.price = res.detail.price;
}).catch(() => {});
      }
    },
    {
      dataField: 'image', caption: t('image'), allowSorting: false, alignment: 'center', width: 120, allowEditing: false,
      cellTemplate: (container: HTMLElement, options: { value: string }) => {
        container.innerHTML = previewImage({ type: 'image', src: options.value, format: 'html' });
      }
    },
    {
      dataField: 'price',
      caption: t('unitPrice'),
      dataType: 'number',
      minWidth: 110,
      allowEditing: false,
      customizeText: ({ value }) => formatter.currency(value),
      // validationRules: [{ type: 'required' }, { type: 'range', min: 0 }]
    },
    {
      dataField: 'quantity',
      caption: t('quantity'),
      dataType: 'number',
      minWidth: 100,
      validationRules: [{ type: 'required' }, { type: 'range', min: 1 }]
    },
    {
      dataField: 'note',
      caption: t('note'),
      minWidth: 140
    }
  ],
  editing: {
    mode: 'batch',
    allowAdding: true,
    allowUpdating: true,
    allowDeleting: true,
    useIcons: true,
    startEditAction: 'click'
  },
  toolbar: { visible: false },
  paging: { pageSize: 10 },
  pager: { showInfo: true, showNavigationButtons: true }
});

const onInitNewRow = (e: any) => {
  e.data.__id = crypto.randomUUID();
  e.data.price = 0;
  e.data.quantity = 1;
};

// Save pending edits, validate, and return the plain rows (without the internal key)
const getRows = async () => {
  const instance = itemsDataGridRef.value?.instance;
  if (!instance) return [];
  await instance.saveEditData();
  if (instance.hasEditData()) throw new Error('invalid');
  const all = await instance.getDataSource().store().load() as any[];
  return all.map(({ __id, image, ...rest }: any) => ({
    ...rest,
    note: rest.note ?? ''
  }));
};

const reset = () => {
  itemsDataGridConfig.value.dataSource = [];
  itemsDataGridRef.value?.instance?.cancelEditData();
};

const addRow = () => {
  itemsDataGridRef.value?.instance?.addRow();
};

defineExpose({ getRows, reset, addRow });
</script>
