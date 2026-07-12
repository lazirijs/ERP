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
                <el-button @click="toggleFilterRowVisibility()" class="w-8 m-0!">
                    <el-icon>
                        <el-icon-filter />
                    </el-icon>
                </el-button>
            </div>
            <el-button @click="createDialogRef?.open()" type="success">
                {{ $t('create') }}
                <el-icon class="ml-2">
                    <el-icon-plus />
                </el-icon>
            </el-button>
        </div>
        <div class="flex-1 min-h-0 min-w-0">
            <data-grid-app
                ref="dataGridRef" width="100%" height="100%"
                :config="dataGridConfig"
                @row-click="$router.push({ name: 'employees-detail', params: { uid: $event.data.uid } })"
            />
        </div>
        <create-dialog-app ref="createDialogRef" @submitted="dataGridRef?.instance?.refresh()" />
    </container-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EmployeeApi from '../api';
import { useI18n } from 'vue-i18n';
import CreateDialogApp from '../components/dialogs/create.vue';

import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';
import { status } from '../constant';
import type { Employee } from '../type';
import { previewImage } from '@/services/files.ts';
import { createDevExtremeCustomStore } from '@/components/devextreme/service.ts';
import type { Team } from '@/modules/teams/type.ts';
import TeamApi from '@/modules/teams/api.ts';

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
        api: EmployeeApi.getAll
    },
    headerFilter: { visible: true },
    columns: [
        {
            dataField: 'image', caption: t('image'), alignment: 'center', width: 120,
            allowSorting: false, allowFiltering: false, allowHeaderFiltering: false,
            cellTemplate: (container: HTMLElement, options: { value: string }) => {
                container.innerHTML = previewImage({ type: 'avatar', src: options.value, format: 'html' });
            }
        },
        { dataField: 'name', caption: t('name'), allowHeaderFiltering: false },
        {
            dataField: 'status', caption: t('status'), alignment: 'center', allowHeaderFiltering: true, allowFiltering: false,
            cellTemplate: (container: HTMLElement, options: { value: Employee["status"] }) => {
                let { label, color } = status[options.value];
                container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
            },
            headerFilter: { dataSource: Object.values(status).map(i => ({ value: i.id, text: t(i.label) })) },
        },
        { dataField: 'team.name', caption: t('team'),
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: TeamApi.getAll,
                    map: (i: Team) => ({ value: i.uid, text: i.name })
                })
            }
        },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc', allowHeaderFiltering: false }
    ]
});
</script>