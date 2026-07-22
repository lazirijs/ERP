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
            <el-button :disabled="!$hasPermission('users.create')" @click="createDialogRef?.open()" class="w-8 sm:w-auto m-0!" type="success">
                <span class="hidden sm:block">{{ $t('create') }}</span>
                <el-icon class="sm:ml-2">
                    <el-icon-plus />
                </el-icon>
            </el-button>
        </div>
        <create-dialog-app ref="createDialogRef" @submitted="dataGridRef?.instance?.refresh()" />
        <edit-dialog-app ref="editDialogRef" @submitted="dataGridRef?.instance?.refresh()" />
        <div class="flex-1 min-h-0 min-w-0">
            <data-grid-app
                ref="dataGridRef"
                :config="dataGridConfig"
                :columns="dataGridConfig.columns"
                @row-click="editDialogRef?.open($event.data)"
            />
        </div>
    </container-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UserApi from '@/modules/users/api';
import formatter from '@/services/formatter';
import CreateDialogApp from '@/modules/users/components/dialogs/create.vue';
import EditDialogApp from '@/modules/users/components/dialogs/edit.vue';
import { status } from '@/modules/users/constant';
import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';

const { t } = useI18n();

const createDialogRef = ref<InstanceType<typeof CreateDialogApp>>();
const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();

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
        api: UserApi.getAll
    },
    headerFilter: { visible: true },
    columns: [
        { dataField: 'name', caption: t('name'), allowHeaderFiltering: false },
        { dataField: 'email', caption: t('email'), allowHeaderFiltering: false },
        { dataField: 'role.name', caption: t('role'), allowHeaderFiltering: false, allowSorting: false, customizeText: ({ value }) => value || t('noRole') },
        {
            dataField: 'status', caption: t('status'), alignment: 'center', allowHeaderFiltering: true, allowFiltering: false,
            cellTemplate: (container: HTMLElement, options: { value: 0 | 1 | 2 }) => {
                const { label, color } = status[options.value];
                container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
            },
            headerFilter: { dataSource: Object.values(status).map(i => ({ value: i.id, text: t(i.label) })) }
        },
        {
            dataField: 'is_admin', caption: t('administrator'), alignment: 'center', allowHeaderFiltering: false, allowFiltering: false,
            cellTemplate: (container: HTMLElement, options: { value: 0 | 1 }) => {
                container.innerHTML = options.value ? `<span class="badge-app-green">${ t('yes') }</span>` : `<span class="text-gray-400">${ t('no') }</span>`;
            }
        },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc', allowHeaderFiltering: false }
    ]
});
</script>