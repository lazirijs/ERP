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
                ref="dataGridRef"
                :config="dataGridConfig"
                :header-filter="{ visible: true }"
                @row-click="$router.push({ name: 'clients-detail', params: { uid: $event.data.uid } })"
            />
        </div>
        <create-dialog-app ref="createDialogRef" @submitted="dataGridRef?.instance?.refresh()" />
    </container-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ClientApi from '../api';
import { useI18n } from 'vue-i18n';
import CreateDialogApp from '../components/dialogs/create.vue';


import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';

const { t } = useI18n();

const createDialogRef = ref<InstanceType<typeof CreateDialogApp>>();

const dataGridRef = ref<DataGridAppRef>();

const search = ref('');

const onSearchChange = (value: string) => {
    value = value.trim();
    setTimeout(() => value === search.value && dataGridRef.value?.instance?.searchByText(value), 500);
};

const dataGridConfig = ref<DataGridPropsConfig>({
    dataSource: {
        key: 'uid',
        api: ClientApi.getAll
    },
    columns: [
        { dataField: 'name', caption: t('name') },
        {
            dataField: 'total_projects', caption: t('totalProjects'),
            headerFilter: { dataSource: [{ text: '-1', value: -1 }, { text: '0', value: 0 }, { text: '+1', value: 1 }] }
        },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
    ]
});
</script>