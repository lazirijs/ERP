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
            </div>
            <el-button v-if="!props.hideCreate" @click="createDialogRef?.open()" class="w-8 sm:w-auto m-0!" type="success">
                <span class="hidden sm:block">{{ $t('create') }}</span>
                <el-icon class="sm:ml-2">
                    <el-icon-plus />
                </el-icon>
            </el-button>
        </div>
        <div class="flex-1 min-h-0 min-w-0">
            <data-grid-app
                ref="dataGridRef"
                :config="dataGridConfig"
                @row-click="$router.push({ name: 'projects-detail', params: { uid: $event.data.uid } })"
            />
        </div>
        <create-dialog-app ref="createDialogRef" @submitted="projectsUpdated()" />
    </component>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ProjectApi from '@/modules/projects/api';
import CreateDialogApp from '../components/dialogs/create.vue';
import { createDevExtremeCustomStore } from '@/components/devextreme/service.ts';

import type { DataGridAppRef, DataGridPropsConfig, DevExtremeDataGridRemoteQueryFilter } from '@/components/devextreme/datagrid/type';
import { status } from '@/modules/projects/constant';
import type { Project } from '@/modules/projects/type';
import formatter from '@/services/formatter';
import ClientApi from '@/modules/clients/api';
import type { Client } from '@/modules/clients/type.ts';

const props = defineProps<{
    view?: { type: 'client'; data: Client };
    hideCreate?: boolean;
}>();

const emit = defineEmits<{
    updated: []
}>();

const { t } = useI18n();

const createDialogRef = ref<InstanceType<typeof CreateDialogApp>>();

const dataGridRef = ref<DataGridAppRef>();

const search = ref('');

const onSearchChange = (value: string) => {
    value = value.trim();
    setTimeout(() => value === search.value && dataGridRef.value?.instance?.searchByText(value), 500);
};

const toggleFilterRowVisibility = () => {
    dataGridRef.value?.instance?.option('filterRow.visible', !dataGridRef.value?.instance?.option('filterRow.visible'));
};

const devExtremeCustomStore = new createDevExtremeCustomStore();

const dataGridConfig = ref<DataGridPropsConfig>({
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
            return await ProjectApi.getAll(query);
        }
    },
    headerFilter: { visible: true },
    columns: [
        { dataField: 'client.name', caption: t('client'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: ClientApi.getAll,
                    map: (i: Client) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != "client"
        },
        { dataField: 'name', caption: t('name'), allowHeaderFiltering: false },
        // { dataField: 'region.name', caption: t('region'), allowSorting: false },
        // { dataField: 'category.name', caption: t('category'), allowSorting: false },
        {
            dataField: 'status', caption: t('status'), alignment: 'center', allowHeaderFiltering: true, allowFiltering: false,
            cellTemplate: (container: HTMLElement, options: { value: Project["status"] }) => {
                let { label, color } = status[options.value];
                container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
            },
            headerFilter: { dataSource: Object.values(status).map(i => ({ value: i.id, text: t(i.label) })) },
        },
        { dataField: 'offer', caption: t('offer'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false },
        { dataField: 'total_amount_received', caption: t('totalAmountReceived'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false },
        { dataField: 'total_amount_expensed', caption: t('totalAmountExpensed'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false },
        { dataField: 'total_amount_sold', caption: t('totalAmountSold'), customizeText: ({ value }) => formatter.currency(value), allowHeaderFiltering: false },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc', allowHeaderFiltering: false }
    ]
});

const projectsUpdated = () => {
    dataGridRef.value?.instance?.refresh();
    emit('updated');
};
</script>