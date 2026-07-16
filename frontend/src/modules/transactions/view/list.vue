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
                :config="dataGridConfig()"
            />
        </div>
        <create-dialog-app ref="createDialogRef" :config="{ [ props.view?.type || '' ]: props.view?.data }" @submitted="transactionsUpdated" />
    </component>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TransactionApi from '@/modules/transactions/api';
import { useI18n } from 'vue-i18n';
import CreateDialogApp from '@/modules/transactions/components/dialogs/create.vue';
import type { DataGridAppRef, DataGridPropsConfig, DevExtremeDataGridRemoteQueryFilter } from '@/components/devextreme/datagrid/type';
import { type } from '@/modules/transactions/constant';
import type { Transaction } from '@/modules/transactions/type';
import formatter from '@/services/formatter';
import { createDevExtremeCustomStore } from '@/components/devextreme/service';

import ProjectApi from '@/modules/projects/api';
import type { Project } from '@/modules/projects/type.ts';
import EmployeeApi from '@/modules/employees/api';
import type { Employee } from '@/modules/employees/type.ts';
import SaleApi from '@/modules/sales/api';
import type { Sale } from '@/modules/sales/type.ts';
import PurchaseApi from '@/modules/purchases/api';
import type { Purchase } from '@/modules/purchases/type.ts';
import AccountApi from '@/modules/accounts/api';
import type { Account } from '@/modules/accounts/type.ts';

const props = defineProps<{
    view?: 
        { type: "project", data: Project } | 
        { type: "employee", data: Employee } | 
        { type: "sale", data: Sale } | 
        { type: "purchase", data: Purchase } | 
        { type: "account", data: Account }
    hideCreate?: boolean
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

const dataGridConfig = () => ({
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
            return await TransactionApi.getAll(query);
        }
    },
    headerFilter: { visible: true },
    columns: [
        {
            dataField: 'project.name', caption: t('project'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: ProjectApi.getAll,
                    map: (i: Project) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != 'project' && props.view?.type != 'purchase'
        },
        { 
            dataField: 'sale.name', caption: t('sale'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: SaleApi.getAll,
                    map: (i: Sale) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != 'sale' && props.view?.type != 'purchase'
        },
        { 
            dataField: 'purchase.name', caption: t('purchase'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: PurchaseApi.getAll,
                    map: (i: Purchase) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != 'project' && props.view?.type != 'purchase' && props.view?.type != 'sale'
        },
        { 
            dataField: 'account.name', caption: t('account'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: AccountApi.getAll,
                    map: (i: Account) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != 'account'
        },
        {
            dataField: 'employee.name', caption: t('employee'), allowSorting: false,
            headerFilter: {
                dataSource: devExtremeCustomStore.lookup({
                    key: 'value',
                    api: EmployeeApi.getAll,
                    map: (i: Employee) => ({ value: i.uid, text: i.name })
                })
            },
            visible: props.view?.type != 'employee'
        },
        {
            dataField: 'type', caption: t('type'), alignment: 'center', allowHeaderFiltering: true, allowFiltering: false,
            cellTemplate: (container: HTMLElement, options: { value: Transaction["type"] }) => {
                let { label, color } = type[options.value];
                container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
            },
            headerFilter: { dataSource: Object.values(type).map(i => ({ value: i.id, text: t(i.label) })) },
            visible: props.view?.type != 'purchase' // purchase transactions are always an expense
        },
        {
            dataField: 'amount', caption: t('amount'), dataType: "number", allowFiltering: true, allowHeaderFiltering: false,
            customizeText: ({ value }: { value: number }) => formatter.currency(value)
        },
        { dataField: 'note', caption: t('note'), allowHeaderFiltering: false },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc', allowHeaderFiltering: false }
    ]
} as DataGridPropsConfig);

const transactionsUpdated = () => {
    dataGridRef.value?.instance?.refresh();
    emit('updated');
};
</script>