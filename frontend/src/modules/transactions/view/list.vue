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
import { type } from '../constant';
import type { Transaction } from '../type';
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
        { dataField: 'project.name', caption: t('project'), allowSorting: false },
        { dataField: 'account.name', caption: t('account'), allowSorting: false },
        { dataField: 'employee.name', caption: t('employee'), allowSorting: false },
        {
            dataField: 'type', caption: t('type'), alignment: 'center', 
            cellTemplate: (container: HTMLElement, options: { value: Transaction["type"] }) => {
                let { label, color } = type[options.value];
                container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
            } 
        },
        { dataField: 'amount', caption: t('amount'), format: formatter.devextreme.currency },
        { dataField: 'note', caption: t('note') },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
    ]
});
</script>