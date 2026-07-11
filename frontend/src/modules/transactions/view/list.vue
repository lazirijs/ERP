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
                <el-button @click="toggleFilterRowVisibility()" :type="toggleFilterRowVisibility(false) ? 'primary' : 'default'" class="w-8 m-0!">
                    <el-icon>
                        <el-icon-filter />
                    </el-icon>
                </el-button>
                <!-- <el-segmented v-model="view" :options="viewOptions" @change="onViewChange" /> -->
            </div>
            <el-button @click="dialogRef?.open()" type="success">
                {{ $t('create') }}
                <el-icon class="ml-2">
                    <el-icon-plus />
                </el-icon>
            </el-button>
        </div>
        <div :key="viewOptions.findIndex(option => option.value === view)" class="flex-1 min-h-0 min-w-0">
            <data-grid-app
                ref="dataGridRef"
                :config="dataGridConfig()"
            />
        </div>
        <create-dialog-app ref="dialogRef" :default-type="view" @submitted="dataGridRef?.instance?.refresh()" />
    </container-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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

const view = ref<undefined | keyof typeof type>();
const viewOptions = computed(() => [
    { label: t('all'), value: undefined },
    { label: t('expense'), value: '-' },
    { label: t('payout'), value: '+' }
]);

const search = ref('');

const onSearchChange = (value: string) => {
    value = value.trim();
    setTimeout(() => {
        if (value === search.value) dataGridRef.value?.instance?.searchByText(value);
    }, 500);
};

const toggleFilterRowVisibility = (toggle: boolean = true): boolean => {
    if (toggle) dataGridRef.value?.instance?.option('filterRow.visible', !dataGridRef.value?.instance?.option('filterRow.visible'));
    return dataGridRef.value?.instance?.option('filterRow.visible') as boolean;
}

const dataGridConfig = () => ({
    dataSource: {
        key: 'uid',
        api: indexApi.getAll
    },
    headerFilter: { visible: true },
    columns: [
        { dataField: 'project.name', caption: t('project'), allowSorting: false },
        { dataField: 'sale.name', caption: t('sale'), allowSorting: false },
        { dataField: 'purchase.name', caption: t('purchase'), allowSorting: false },
        { dataField: 'account.name', caption: t('account'), allowSorting: false },
        { dataField: 'employee.name', caption: t('employee'), allowSorting: false },
        {
            dataField: 'type', caption: t('type'), alignment: 'center', allowHeaderFiltering: true, allowFiltering: false,
            cellTemplate: (container: HTMLElement, options: { value: Transaction["type"] }) => {
                let { label, color } = type[options.value];
                container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
            },
            headerFilter: { dataSource: Object.values(type).map(i => ({ value: i.id, text: t(i.label) })) }
        },
        { dataField: 'amount', caption: t('amount'), customizeText: ({ value }: { value: number }) => formatter.currency(value) },
        { dataField: 'note', caption: t('note') },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
    ].filter(({ dataField }) => {
        if (view.value === '+') return !['type', 'account.name', 'employee.name', 'purchase.name'].includes(dataField);
        else if (view.value === '-') return !['type'].includes(dataField);
        else return true
    }),
} as DataGridPropsConfig);
</script>