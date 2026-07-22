<template>
    <component :is="props.view?.type ? 'div' : 'container-app'" type="fixed" v-bind="$attrs" :class="{ 'grid gap-app': props.view?.type }">
        <div class="flex justify-between items-center gap-3 sm:gap-app">
            <div class="w-full sm:w-auto flex items-center gap-2">
                <el-input v-model="search" @input="onSearchChange" dir="auto" :placeholder="$t('search')" class="md:w-75!">
                    <template #prefix>
                        <el-icon>
                            <el-icon-search />
                        </el-icon>
                    </template>
                </el-input>
                <el-button @click="dataGridRef?.instance?.refresh()" class="w-8">
                    <el-icon>
                        <el-icon-refresh />
                    </el-icon>
                </el-button>
                <el-button @click="toggleFilterRowVisibility()" class="w-8 m-0!">
                    <el-icon>
                        <el-icon-filter />
                    </el-icon>
                </el-button>
                <el-segmented v-if="!$appStore().isMobile && props.view?.type !== 'product'" v-model="section" :options="sectionOptions" />
            </div>
            <el-button v-if="!props.hideCreate && props.view?.type != 'product'" :disabled="!$hasPermission('purchases.create')" @click="createDialogRef?.open()" class="w-8 sm:w-auto m-0!" type="success">
                <span class="hidden sm:block">{{ $t('create') }}</span>
                <el-icon class="sm:ml-2">
                    <el-icon-plus />
                </el-icon>
            </el-button>
        </div>
        <div class="flex-1 min-h-0 min-w-0">
            <data-grid-app
                v-if="section === 'purchase' && props.view?.type !== 'product'"
                ref="dataGridRef"
                :config="purchasesDataGridConfig"
                @row-click="$router.push({ name: 'purchases-detail', params: { uid: $event.data.uid } })"
            />
            <purchase-items-data-grid-app v-else ref="dataGridRef" @row-click="$router.push({ name: 'purchases-detail', params: { uid: $event.data.purchase_uid } })" />
        </div>
        <create-dialog-app ref="createDialogRef" :supplier="props.view?.type === 'supplier' ? props.view.data : undefined" :default-mode="section === 'product' ? 'items' : 'purchase'" @submitted="purchasesUpdated" />
    </component>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import PurchaseApi from '@/modules/purchases/api';
import { useI18n } from 'vue-i18n';
import CreateDialogApp from '@/modules/purchases/components/dialogs/create.vue';
import PurchaseItemsDataGridApp from '@/modules/purchases/items/components/datagrid.vue';
import { createDevExtremeCustomStore } from '@/components/devextreme/service.ts';

import type { DataGridAppRef, DataGridPropsConfig, DevExtremeDataGridRemoteQueryFilter } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';
import type { Product } from '@/modules/products/type.ts';
import SupplierApi from '@/modules/suppliers/api';
import type { Supplier } from '@/modules/suppliers/type.ts';
import type { Purchase } from '@/modules/purchases/type.ts';

const props = defineProps<{
    view?: 
        { type: "product", data: Product } |
        { type: "supplier", data: Supplier } |
        { type: "purchase", data: Purchase }
    hideCreate?: boolean
    defaultSection?: 'purchase' | 'product'
}>();

const emit = defineEmits<{
    updated: []
}>();

const { t } = useI18n();

const dataGridRef = ref<DataGridAppRef>();
const createDialogRef = ref<InstanceType<typeof CreateDialogApp>>();

const section = ref<'purchase' | 'product'>(props.defaultSection || 'purchase');
const sectionOptions = computed(() => [
    { label: t('byPurchase'), value: 'purchase' },
    { label: t('byProduct'), value: 'product' }
]);

onMounted(() => props.view?.type == "product" && (section.value = "product"));

const search = ref('');

const onSearchChange = (value: string) => {
    value = value.trim();
    setTimeout(() => value === search.value && dataGridRef.value?.instance?.searchByText(value), 500);
};

const toggleFilterRowVisibility = () => {
    dataGridRef.value?.instance?.option('filterRow.visible', !dataGridRef.value?.instance?.option('filterRow.visible'));
};

const devExtremeCustomStore = new createDevExtremeCustomStore();

const purchasesDataGridConfig = ref<DataGridPropsConfig>({
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
            return await PurchaseApi.getAll(query);
        }
    },
    headerFilter: { visible: true },
    columns: [
        { dataField: 'name', caption: t('name'), allowHeaderFiltering: false },
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
        { dataField: 'items_count', caption: t('itemsCount'), allowHeaderFiltering: false },
        { dataField: 'total_amount', caption: t('totalAmountItems'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false },
        { dataField: 'total_amount_expensed', caption: t('totalAmountExpensed'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false },
        { dataField: 'note', caption: t('note'), allowHeaderFiltering: false },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc', allowHeaderFiltering: false }
    ]
});

const purchasesUpdated = () => {
    dataGridRef.value?.instance?.refresh();
    emit('updated');
};
</script>
