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
            <el-button @click="dialogRef?.open()" type="success">
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
                @row-click="$router.push({ name: 'projects-detail', params: { uid: $event.data.uid } })"
            />
        </div>
        <create-dialog-app ref="dialogRef" @submitted="dataGridRef?.instance?.refresh()" />
    </container-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import indexApi from '../api';
import { useI18n } from 'vue-i18n';
import CreateDialogApp from '../components/dialogs/create.vue';


import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import { status } from '../constant';
import type { Project } from '../type';
import formatter from '@/services/formatter';

const { t } = useI18n();

const dialogRef = ref<InstanceType<typeof CreateDialogApp>>();

const dataGridRef = ref<DataGridAppRef>();

const search = ref('');

const onSearchChange = (value: string) => {
    value = value.trim();
    setTimeout(() => {
        if (value === search.value) dataGridRef.value?.instance?.option('searchPanel.text', value);
    }, 500);
};

const dataGridConfig = ref<DataGridPropsConfig>({
    dataSource: {
        key: 'uid',
        api: indexApi.getAll
    },
    columns: [
        { dataField: 'client.name', caption: t('client'), allowSorting: false },
        { dataField: 'name', caption: t('name') },
        { dataField: 'region.name', caption: t('region'), allowSorting: false },
        { dataField: 'category.name', caption: t('category'), allowSorting: false },
        {
            dataField: 'status', caption: t('status'), alignment: 'center', 
            cellTemplate: (container: HTMLElement, options: { value: Project["status"] }) => {
                let { label, color } = status[options.value];
                container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
            } 
        },
        { dataField: 'offer', caption: t('offer'), customizeText: ({ value }) => formatter.currency(value) },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
    ]
});
</script>