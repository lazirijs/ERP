<template>
    <data-grid-app
        v-bind="$attrs"
        ref="dataGridRef"
        :config="itemsDataGridConfig"        
    />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DataGridAppRef, DataGridPropsConfig, DevExtremeDataGridRemoteQueryFilter } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';
import { previewImage } from '@/services/files';
import SaleApi from '@/modules/sales/api';
import itemsApi from '@/modules/sales/items/api';
import type { Sale } from '@/modules/sales/type.ts';
import ProductApi from '@/modules/products/api';
import type { Product } from '@/modules/products/type.ts';
import { status } from '@/modules/sales/constant';
import { createDevExtremeCustomStore } from '@/components/devextreme/service.ts';

const props = defineProps<{
    view?: 
        { type: "sale", data: Sale } |
        { type: "product", data: Product }
}>();

const { t } = useI18n();

const dataGridRef = ref<DataGridAppRef>();

const devExtremeCustomStore = new createDevExtremeCustomStore();

const itemsDataGridConfig = ref<DataGridPropsConfig>({
    dataSource: {
        key: 'uid',
        api: async (query) => {
            if (props.view) {
                const filter: DevExtremeDataGridRemoteQueryFilter = {
                    field: props.view.type + ".name",
                    values: [props.view.data.uid],
                    operation: '='
                }
                query.filters = [...(query.filters || []), filter];
            }
            return await itemsApi.getAll(query);
        }
    },
    headerFilter: { visible: true },
    columns: [
        { 
            dataField: 'sale.name', caption: t('sale'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: SaleApi.getAll,
                    map: (i: Sale) => ({ value: i.uid, text: i.name })
                })
            }
        },
        { 
            dataField: 'sale.status', caption: t('status'), alignment: 'center', allowHeaderFiltering: true, allowFiltering: false,
            cellTemplate: (container: HTMLElement, options: { value: 0 | 1 }) => {
                const { label, color } = status[options.value];
                container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
            },
            headerFilter: { dataSource: Object.values(status).map(i => ({ value: i.id, text: t(i.label) })) }
        },
        {
            dataField: 'product.image', caption: t('image'), alignment: 'center', width: 120, 
            allowSorting: false, allowEditing: false, allowHeaderFiltering: false, allowFiltering: false,
            cellTemplate: (container: HTMLElement, options: { value: string }) => {
                container.innerHTML = previewImage({ type: 'image', src: options.value, format: 'html' });
            },
            visible: props.view?.type != 'product'
        },
        { 
            dataField: 'product.name', caption: t('product'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: ProductApi.getAll,
                    map: (i: Product) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != 'product'
        },
        { dataField: 'price', caption: t('unitPrice'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false },
        { dataField: 'quantity', caption: t('quantity'), allowHeaderFiltering: false },
        { dataField: 'total', caption: t('total'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false, allowFiltering: false }, // no such column item.total
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc', allowHeaderFiltering: false }
    ]
});

defineExpose({
  get instance() {
    return dataGridRef.value?.instance;
  }
});
</script>