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
import PurchaseApi from '@/modules/purchases/api';
import itemsApi from '@/modules/purchases/items/api';
import type { Purchase } from '@/modules/purchases/type.ts';
import ProductApi from '@/modules/products/api';
import type { Product } from '@/modules/products/type.ts';
import SupplierApi from '@/modules/suppliers/api';
import type { Supplier } from '@/modules/suppliers/type.ts';
import { createDevExtremeCustomStore } from '@/components/devextreme/service.ts';

const props = defineProps<{
    view?: 
        { type: "purchase", data: Purchase } |
        { type: "product", data: Product } |
        { type: "supplier", data: Supplier }
    hideCreate?: boolean;
    hideHeader?: boolean;
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
            dataField: 'product.image', caption: t('image'), alignment: 'center', width: 120, 
            allowSorting: false, allowEditing: false, allowHeaderFiltering: false,
            cellTemplate: (container: HTMLElement, options: { value: string }) => {
            container.innerHTML = previewImage({ type: 'image', src: options.value, format: 'html' });
            },
            visible: props.view?.type != 'product'
        },
        { dataField: 'product.name', caption: t('product'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: ProductApi.getAll,
                    map: (i: Product) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != 'product'
        },
        { dataField: 'supplier.name', caption: t('supplier'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: SupplierApi.getAll,
                    map: (i: Supplier) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != 'supplier'
        },
        { dataField: 'price', caption: t('unitPrice'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false },
        { dataField: 'quantity', caption: t('quantity'), allowHeaderFiltering: false },
        { dataField: 'total', caption: t('total'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false },
        { dataField: 'purchase.name', caption: t('purchase'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: PurchaseApi.getAll,
                    map: (i: Purchase) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != 'purchase'
        },
        { dataField: 'note', caption: t('note'), allowHeaderFiltering: false },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc', allowHeaderFiltering: false }
    ]
});

defineExpose({
  get instance() {
    return dataGridRef.value?.instance;
  }
});
</script>