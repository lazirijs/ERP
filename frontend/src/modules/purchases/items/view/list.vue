<template>
    <component :is="props.view?.type ? 'div' : 'container-app'" type="fixed" v-bind="$attrs" :class="{ 'grid gap-app': props.view?.type }">
        <div v-if="!props.hideHeader" class="flex justify-between items-center gap-app">
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
            <el-button v-if="!props.hideCreate && props.view?.type != 'product'" @click="batchAddDialogRef?.open()" type="success">
                {{ $t('add') }}
                <el-icon class="ml-2">
                    <el-icon-plus />
                </el-icon>
            </el-button>
        </div>
        <div class="flex-1 min-h-0 min-w-0">
            <purchase-items-datagrid-app ref="dataGridRef" :view="props.view" @row-click="itemEditDialogRef?.open($event.data)" />
        </div>
        <batch-add-dialog-app ref="batchAddDialogRef" :purchase_uid="props.view?.type == 'purchase' ? props.view.data.uid : ''" @submitted="purchaseItemsUpdated" />
        <item-edit-dialog-app ref="itemEditDialogRef" @submitted="purchaseItemsUpdated" />
    </component>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PurchaseItemsDatagridApp from '@/modules/purchases/items/components/datagrid.vue';
import BatchAddDialogApp from '@/modules/purchases/items/components/dialogs/batch-add.vue';
import ItemEditDialogApp from '@/modules/purchases/items/components/dialogs/edit.vue';
import type { Purchase } from '@/modules/purchases/type.ts';
import type { Product } from '@/modules/products/type.ts';
import type { Supplier } from '@/modules/suppliers/type.ts';
import type { DataGridAppRef } from '@/components/devextreme/datagrid/type';

const props = defineProps<{
    view?: 
        { type: "purchase", data: Purchase } |
        { type: "product", data: Product } |
        { type: "supplier", data: Supplier }
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
}

const purchaseItemsUpdated = () => {
    dataGridRef.value?.instance?.refresh();
    emit('updated');
};

defineExpose({
    toggleFilterRowVisibility
});
</script>
