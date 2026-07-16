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
            <el-button v-if="!props.hideCreate && props.view?.type != 'product'" @click="createDialogRef?.open()" class="w-8 sm:w-auto m-0!" type="success">
                <span class="hidden sm:block">{{ $t('create') }}</span>
                <el-icon class="sm:ml-2">
                    <el-icon-plus />
                </el-icon>
            </el-button>
        </div>
        <div class="flex-1 min-h-0 min-w-0">
            <data-grid-app
                v-if="section === 'sale' && props.view?.type !== 'product'"
                ref="dataGridRef"
                :config="salesDataGridConfig"
                @row-click="$router.push({ name: 'sales-detail', params: { uid: $event.data.uid } })"
            />
            <sale-items-data-grid-app v-else ref="dataGridRef" @row-click="$router.push({ name: 'sales-detail', params: { uid: $event.data.sale_uid } })" />
        </div>
        <create-dialog-app ref="createDialogRef" :config="{ [props.view?.type || '']: props.view?.data }" @submitted="salesUpdated" />
    </component>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import SaleApi from '../api';
import { useI18n } from 'vue-i18n';
import CreateDialogApp from '../components/dialogs/create.vue';
import { status } from '../constant';

import type { DataGridAppRef, DataGridPropsConfig, DevExtremeDataGridRemoteQueryFilter } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';
import { createDevExtremeCustomStore } from '@/components/devextreme/service.ts';
import ProjectApi from '@/modules/projects/api';
import type { Project } from '@/modules/projects/type.ts';
import ClientApi from '@/modules/clients/api';
import type { Client } from '@/modules/clients/type.ts';
import type { Product } from '@/modules/products/type.ts';
import SaleItemsDataGridApp from '@/modules/sales/items/components/datagrid.vue';

const props = defineProps<{
    view?: 
        { type: "project", data: Project } |
        { type: "product", data: Product } |
        { type: "client", data: Client }
    hideCreate?: boolean
    defaultSection?: 'sale' | 'product'
}>();

const emit = defineEmits<{
    updated: []
}>();

const { t } = useI18n();

const createDialogRef = ref<InstanceType<typeof CreateDialogApp>>();
const dataGridRef = ref<DataGridAppRef>();

const section = ref<'sale' | 'product'>(props.defaultSection || 'sale');
const sectionOptions = computed(() => [
    { label: t('bySale'), value: 'sale' },
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

const salesDataGridConfig = ref<DataGridPropsConfig>({
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
            return await SaleApi.getAll(query);
        }
    },
    headerFilter: { visible: true },
    columns: [
        { dataField: 'name', caption: t('name'), allowHeaderFiltering: false  },
        { dataField: 'client.name', caption: t('client'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: ClientApi.getAll,
                    map: (i: Client) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != 'client' && props.view?.type != 'project'
        },
        {
            dataField: 'project.name', caption: t('project'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: ProjectApi.getAll,
                    map: (i: Project) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != 'project'
        },
        {
            dataField: 'status', caption: t('status'), alignment: 'center', allowHeaderFiltering: true, allowFiltering: false,
            cellTemplate: (container: HTMLElement, options: { value: 0 | 1 }) => {
                const { label, color } = status[options.value];
                container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
            },
            headerFilter: { dataSource: Object.values(status).map(i => ({ value: i.id, text: t(i.label) })) },
        },
        { dataField: 'items_count', caption: t('itemsCount'), allowHeaderFiltering: false  },
        { dataField: 'total_amount', caption: t('totalAmountItems'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false },
        { dataField: 'total_amount_received', caption: t('totalAmountReceived'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false  },
        { dataField: 'total_amount_expensed', caption: t('totalAmountExpensed'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc', allowHeaderFiltering: false }
    ]
});

const salesUpdated = () => {
    dataGridRef.value?.instance?.refresh();
    emit('updated');
};
</script>
