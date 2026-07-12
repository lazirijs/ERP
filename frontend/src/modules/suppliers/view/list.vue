<template>
    <component :is="props.view?.type ? 'div' : 'container-app'" type="fixed" v-bind="$attrs" :class="{ 'grid gap-app': props.view?.type }">
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
            <el-button v-if="!props.hideCreate" @click="createDialogRef?.open()" type="success">
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
                @row-click="$router.push({ name: 'suppliers-detail', params: { uid: $event.data.uid } })"
            />
        </div>
        <create-dialog-app ref="createDialogRef" @submitted="dataGridRef?.instance?.refresh()" />
    </component>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SupplierApi from '@/modules/suppliers/api';
import CreateDialogApp from '@/modules/suppliers/components/dialogs/create.vue';

import formatter from '@/services/formatter';
import type { Product } from '@/modules/products/type.ts';
import type { DataGridAppRef, DataGridPropsConfig, DevExtremeDataGridRemoteQueryFilter } from '@/components/devextreme/datagrid/type';

const props = defineProps<{
    view?: 
        { type: "product", data: Product }
    hideCreate?: boolean
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
}

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
            return await SupplierApi.getAll(query);
        }
    },
    headerFilter: { visible: true },
    columns: [
        { dataField: 'name', caption: t('name'), allowHeaderFiltering: false },
        { dataField: 'contact', caption: t('contact'), allowHeaderFiltering: false },
        { dataField: 'address', caption: t('address'), allowHeaderFiltering: false },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc', allowHeaderFiltering: false }
    ]
});
</script>
