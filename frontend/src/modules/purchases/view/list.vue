<template>
    <container-app type="fixed">
        <div class="flex justify-between items-center gap-app">
            <div class="flex items-center gap-2">
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
                <el-segmented v-model="view" :options="viewOptions" />
            </div>
            <el-button @click="dialogRef?.open()" type="success">
                {{ $t('create') }}
                <el-icon class="ml-2">
                    <el-icon-plus />
                </el-icon>
            </el-button>
        </div>
        <div class="flex-1 min-h-0 min-w-0">
            <data-grid-app
                v-if="view === 'purchase'"
                ref="dataGridRef"
                :config="purchasesDataGridConfig"
                @row-click="$router.push({ name: 'purchases-detail', params: { uid: $event.data.uid } })"
            />
            <data-grid-app
                v-else
                ref="dataGridRef"
                :config="itemsDataGridConfig"
                @row-click="$event.data.purchase && $router.push({ name: 'purchases-detail', params: { uid: $event.data.purchase.uid } })"
            />
        </div>
        <create-dialog-app ref="dialogRef" @submitted="dataGridRef?.instance?.refresh()" />
    </container-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import indexApi from '../api';
import itemsApi from '../items/api';
import { useI18n } from 'vue-i18n';
import CreateDialogApp from '../components/dialogs/create.vue';

import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';
import { previewImage } from '@/services/files';

const { t } = useI18n();

const dialogRef = ref<InstanceType<typeof CreateDialogApp>>();
const dataGridRef = ref<DataGridAppRef>();

const view = ref<'purchase' | 'product'>('purchase');
const viewOptions = computed(() => [
    { label: t('byPurchase'), value: 'purchase' },
    { label: t('byProduct'), value: 'product' }
]);

const search = ref('');
const onSearchChange = (value: string) => {
    value = value.trim();
    setTimeout(() => {
        if (value === search.value) dataGridRef.value?.instance?.option('searchPanel.text', value);
    }, 500);
};

const purchasesDataGridConfig = ref<DataGridPropsConfig>({
    dataSource: {
        key: 'uid',
        api: indexApi.getAll
    },
    columns: [
        { dataField: 'name', caption: t('name') },
        { dataField: 'supplier.name', caption: t('supplier'), allowSorting: false },
        { dataField: 'items_count', caption: t('itemsCount') },
        { dataField: 'total_amount', caption: t('total'), customizeText: ({ value }) => formatter.currency(value) },
        { dataField: 'note', caption: t('note') },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
    ]
});

const itemsDataGridConfig = ref<DataGridPropsConfig>({
    dataSource: {
        key: 'uid',
        api: itemsApi.getAll
    },
    columns: [
        {
          dataField: 'product.image', caption: t('image'), allowSorting: false, alignment: 'center', width: 120, allowEditing: false,
          cellTemplate: (container: HTMLElement, options: { value: string }) => {
            container.innerHTML = previewImage({ type: 'image', src: options.value, format: 'html' });
          }
        },
        { dataField: 'product.name', caption: t('product'), allowSorting: false },
        { dataField: 'supplier.name', caption: t('supplier'), allowSorting: false },
        { dataField: 'price', caption: t('unitPrice'), customizeText: ({ value }) => formatter.currency(value) },
        { dataField: 'quantity', caption: t('quantity') },
        { dataField: 'total', caption: t('total'), customizeText: ({ value }) => formatter.currency(value) },
        { dataField: 'purchase.name', caption: t('purchase'), allowSorting: false },
        { dataField: 'note', caption: t('note') },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
    ]
});
</script>
