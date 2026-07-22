<template>
    <container-app type="fixed">
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
            <el-button :disabled="!$hasPermission('accounts.create')" @click="createDialogRef?.open()" class="w-8 sm:w-auto m-0!" type="success">
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
                @row-click="$router.push({ name: 'accounts-detail', params: { uid: $event.data.uid } })"
            />
        </div>
        <create-dialog-app ref="createDialogRef" @submitted="dataGridRef?.instance?.refresh()" />
    </container-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AccountApi from '../api';
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

const toggleFilterRowVisibility = () => {
    dataGridRef.value?.instance?.option('filterRow.visible', !dataGridRef.value?.instance?.option('filterRow.visible'));
};

const dataGridConfig = ref<DataGridPropsConfig>({
    dataSource: {
        key: 'uid',
        api: AccountApi.getAll
    },
    columns: [
        { dataField: 'name', caption: t('name') },
        { dataField: 'description', caption: t('description') },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
    ]
});
</script>