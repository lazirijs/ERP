<template>
    <component :is="props.view?.type ? 'div' : 'container-app'" type="fixed" v-bind="$attrs" :class="{ 'grid gap-app': props.view?.type }">
        <div v-if="!props.hideHeader" class="flex justify-between items-center gap-3 sm:gap-app">
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
            <el-button v-if="!props.hideCreate && props.view?.type != 'product'" @click="batchAddDialogRef?.open()" type="success">
                {{ $t('add') }}
                <el-icon class="ml-2">
                    <el-icon-plus />
                </el-icon>
            </el-button>
        </div>
        <div class="flex-1 min-h-0 min-w-0">
            <sale-items-datagrid-app ref="dataGridRef" :view="props.view" @row-click="onRowClick" />
        </div>
        <batch-add-dialog-app ref="batchAddDialogRef" :sale_uid="props.view?.type == 'sale' ? props.view.data.uid : ''" @submitted="itemsUpdated" />
        <item-edit-dialog-app ref="itemEditDialogRef" @submitted="itemsUpdated" />
    </component>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SaleItemsDatagridApp from '@/modules/sales/items/components/datagrid.vue';
import BatchAddDialogApp from '@/modules/sales/items/components/dialogs/batch-add.vue';
import ItemEditDialogApp from '@/modules/sales/items/components/dialogs/edit.vue';
import type { Sale } from '@/modules/sales/type.ts';
import type { SaleItem } from '@/modules/sales/items/type.ts';
import type { Product } from '@/modules/products/type.ts';
import type { DataGridAppRef } from '@/components/devextreme/datagrid/type';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import router from '@/router';

const { t } = useI18n();

const props = defineProps<{
    view?: 
        { type: "sale", data: Sale } |
        { type: "product", data: Product }
    hideCreate?: boolean;
    hideHeader?: boolean;
}>();

const emit = defineEmits<{
    updated: []
}>();

const dataGridRef = ref<DataGridAppRef>();
const batchAddDialogRef = ref<InstanceType<typeof BatchAddDialogApp>>();
const itemEditDialogRef = ref<InstanceType<typeof ItemEditDialogApp>>();

const search = ref('');

const onSearchChange = (value: string) => {
    value = value.trim();
    setTimeout(() => value === search.value && dataGridRef.value?.instance?.searchByText(value), 500);
};

const toggleFilterRowVisibility = () => {
    dataGridRef.value?.instance?.option('filterRow.visible', !dataGridRef.value?.instance?.option('filterRow.visible'));
};

const onRowClick = (event: { data: SaleItem }) => {
    if (props.view?.type == 'sale') {
        // A completed sale is frozen: its cost of goods is committed, so items can't be edited.
        if (props.view.data.status == 1) return ElMessage.info(t('saleCompletedItemsLocked'));
        itemEditDialogRef?.value?.open(event.data);
    }
    else router.push({ name: 'sales-detail', params: { uid: event.data.sale.uid } })
};

const itemsUpdated = () => {
    dataGridRef.value?.instance?.refresh();
    emit('updated');
};

defineExpose({
    toggleFilterRowVisibility
});
</script>