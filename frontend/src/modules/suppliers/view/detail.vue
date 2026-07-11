<template>
  <container-app type="scroll" v-loading="loadingContainer.includes('detail')">
    <div v-if="!loadingContainer.includes('detail')" class="grid grid-cols-1 md:grid-cols-4 items-start gap-app">
      <el-card shadow="never">
        <template #header>
          <div class="flex justify-between items-center gap-app">
            <el-button @click="$router.back()" text class="m-0!">
              <el-icon><el-icon-arrow-left /></el-icon>
            </el-button>
            <span class="hidden lg:block">{{ $t('generalInfo') }}</span>
            <el-button @click="dialogRef?.open()" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div class="space-y-app">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('name') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('contact') }}</label>
            <span v-if="formData.contact" class="block text-sm text-gray-900">{{ formData.contact }}</span>
            <span v-else class="block text-sm text-gray-400">{{ $t('notProvided') }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('address') }}</label>
            <span v-if="formData.address" class="block text-sm text-gray-900">{{ formData.address }}</span>
            <span v-else class="block text-sm text-gray-400">{{ $t('notProvided') }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('description') }}</label>
            <span v-if="formData.description" class="block text-sm text-gray-900">{{ formData.description }}</span>
            <span v-else class="block text-sm text-gray-400">{{ $t('notProvided') }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('createdAt') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.date(formData.created_at) }}</span>
          </div>
        </div>
      </el-card>
      <div class="col-span-1 md:col-span-3 flex-1 space-y-app">
        <el-tabs v-model="tab" type="border-card">
          <el-tab-pane :label="$t('purchases')" name="purchases">
            <div v-if="tab === 'purchases'" class="space-y-app">
              <div class="flex items-center gap-2">
                <el-input v-model="search" @input="onSearchChange" dir="auto" :placeholder="$t('search')" class="md:w-75!">
                  <template #prefix>
                    <el-icon><el-icon-search /></el-icon>
                  </template>
                </el-input>
                <el-button @click="dataGridRef?.instance?.refresh()" class="w-8">
                  <el-icon><el-icon-refresh /></el-icon>
                </el-button>
                <el-segmented v-model="view" :options="viewOptions" />
              </div>
              <data-grid-app
                v-if="view === 'purchase'"
                ref="dataGridRef"
                :config="purchasesDataGridConfig"
                @row-click="$router.push({ name: 'purchases-detail', params: { uid: $event.data.uid } })"
              />
              <data-grid-app
                v-else
                ref="dataGridRef"
                :config="itemsDataGridConfig"
                @row-click="$router.push({ name: 'purchases-detail', params: { uid: $event.data.purchase.uid } })"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="dialogRef" :supplier_uid="formData.uid" @submitted="load()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { get } from '../api';
import type { Supplier } from '../type';
import purchasesApi from '@/modules/purchases/api';
import purchaseItemsApi from '@/modules/purchases/items/api';
import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';
import { previewImage } from '@/services/files';

import EditDialogApp from '../components/dialogs/edit.vue';

const { t } = useI18n();
const route = useRoute();

const loadingContainer = ref<('detail')[]>([]);

const tab = ref('purchases');

const dialogRef = ref<InstanceType<typeof EditDialogApp>>();
const dataGridRef = ref<DataGridAppRef>();

const formData = ref<Supplier>({} as Supplier);

const view = ref<'purchase' | 'product'>('purchase');
const viewOptions = computed(() => [
  { label: t('byPurchase'), value: 'purchase' },
  { label: t('byProduct'), value: 'product' }
]);

const search = ref('');
const onSearchChange = (value: string) => {
  value = value.trim();
  setTimeout(() => {
    if (value === search.value) dataGridRef.value?.instance?.searchByText(value);
  }, 500);
};

const purchasesDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => purchasesApi.getAll({ ...query, supplier_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'name', caption: t('name') },
    { dataField: 'items_count', caption: t('itemsCount') },
    { dataField: 'total_amount', caption: t('total'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'note', caption: t('note') },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});

const itemsDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => purchaseItemsApi.getAll({ ...query, supplier_uid: route.params.uid as string })
  },
  columns: [
    {
      dataField: 'product.image', caption: t('image'), allowSorting: false, alignment: 'center', width: 120, allowEditing: false,
      cellTemplate: (container: HTMLElement, options: { value: string }) => {
        container.innerHTML = previewImage({ type: 'image', src: options.value, format: 'html' });
      }
    },
    { dataField: 'product.name', caption: t('product'), allowSorting: false },
    { dataField: 'price', caption: t('unitPrice'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'quantity', caption: t('quantity') },
    { dataField: 'total', caption: t('total'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'purchase.name', caption: t('purchase'), allowSorting: false },
    { dataField: 'note', caption: t('note') },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});

const load = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(load);
</script>
