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
          <img :src="$previewImage({ type: 'image', src: formData.image })" class="w-full aspect-square object-cover rounded-lg" />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('name') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('price') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.currency(formData.price) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('remainingQuantity') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.quantity }}</span>
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
          <el-tab-pane :label="$t('sales')" name="sales">
            <sales-list-app v-if="tab === 'sales'" :view="{ type: 'product', data: formData }" @updated="load()" />
          </el-tab-pane>
          <el-tab-pane :label="$t('purchases')" name="purchases">
            <data-grid-app
              v-if="tab === 'purchases'"
              :config="purchasesDataGridConfig"
              @row-click="$router.push({ name: 'purchases-detail', params: { uid: $event.data.purchase.uid } })"
            />
          </el-tab-pane>
          <el-tab-pane :label="$t('suppliers')" name="suppliers">
            <data-grid-app
              v-if="tab === 'suppliers'"
              :config="suppliersDataGridConfig"
              @row-click="$router.push({ name: 'suppliers-detail', params: { uid: $event.data.uid } })"
            />
          </el-tab-pane>
          <el-tab-pane :label="$t('images')" name="images">
            <images-gallery-app v-if="tab === 'images'" :uid="formData.uid" :image="formData.image" @changed="load()" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="dialogRef" :product_uid="formData.uid" @submitted="load()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { get } from '../api';
import type { Product } from '../type';
import SalesListApp from '@/modules/sales/view/list.vue';
import purchaseItemsApi from '@/modules/purchases/items/api';
import suppliersApi from '@/modules/suppliers/api';
import type { DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';

import EditDialogApp from '../components/dialogs/edit.vue';
import ImagesGalleryApp from '../components/images-gallery.vue';

const { t } = useI18n();
const route = useRoute();

const loadingContainer = ref<('detail')[]>([]);

const tab = ref<'sales' | 'purchases' | 'suppliers' | 'images'>('sales');

const dialogRef = ref<InstanceType<typeof EditDialogApp>>();

const formData = ref<Product>({} as Product);

const purchasesDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => purchaseItemsApi.getAll({ ...query, product_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'purchase.name', caption: t('purchase'), allowSorting: false },
    { dataField: 'supplier.name', caption: t('supplier'), allowSorting: false },
    { dataField: 'price', caption: t('unitPrice'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'quantity', caption: t('quantity') },
    { dataField: 'total_amount', caption: t('totalAmountItems'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'total_amount_expensed', caption: t('totalAmountExpensed'), customizeText: ({ value }) => formatter.currency(value) },
    { dataField: 'note', caption: t('note') },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});

const suppliersDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => suppliersApi.getAll({ ...query, product_uid: route.params.uid as string })
  },
  columns: [
    { dataField: 'name', caption: t('supplier'), allowSorting: false },
    { dataField: 'contact', caption: t('contact') },
    { dataField: 'address', caption: t('address') },
    { dataField: 'description', caption: t('description') },
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
