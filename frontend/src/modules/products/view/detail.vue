<template>
  <container-app type="scroll" v-loading="loadingContainer.includes('detail')">
    <div v-if="!loadingContainer.includes('detail')" class="grid grid-cols-1 md:grid-cols-4 items-start gap-app">
      <el-card shadow="never">
        <template #header>
          <div class="flex justify-between items-center gap-app">
            <el-button @click="$router.back()" text class="m-0!">
              <el-icon><el-icon-arrow-left /></el-icon>
            </el-button>
            <span class="truncate">{{ $t('generalInfo') }}</span>
            <el-button @click="editDialogRef?.open()" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div class="space-y-app">
          <div>
            <a :href="$getFileUrl(formData.image)" target="_blank" rel="noopener">
              <img :src="$previewImage({ type: 'image', src: formData.image })" class="w-full aspect-square object-cover rounded-lg" />
            </a>
          </div>
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
        <el-tabs type="border-card" :default-value="$route.query.tab || 'sales'" @tab-change="$router.replace({ query: { tab: $event } })">
          <el-tab-pane :label="$t('sales')" name="sales">
            <sales-items-list-app v-if="$route.query.tab === 'sales' || !$route.query.tab" :view="{ type: 'product', data: formData }" @row-click="$" />
          </el-tab-pane>
          <el-tab-pane :label="$t('purchases')" name="purchases">
            <purchase-items-list-app v-if="$route.query.tab === 'purchases'" :view="{ type: 'product', data: formData }" @row-click="$router.push({ name: 'purchases-detail', params: { uid: $event.data.purchase.uid } })" />
          </el-tab-pane>
          <el-tab-pane :label="$t('suppliers')" name="suppliers">
            <suppliers-list-app v-if="$route.query.tab === 'suppliers'" :view="{ type: 'product', data: formData }" @row-click="$router.push({ name: 'suppliers-detail', params: { uid: $event.data.uid } })" />
          </el-tab-pane>
          <el-tab-pane :label="$t('images')" name="images">
            <images-gallery-tab v-if="$route.query.tab === 'images'" :uid="formData.uid" :image="formData.image" @changed="load()" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="editDialogRef" :product_uid="formData.uid" @submitted="load()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import ProductsApi from '@/modules/products/api';
import type { Product } from '@/modules/products/type';
import SalesItemsListApp from '@/modules/sales/items/view/list.vue';
import SuppliersListApp from '@/modules/suppliers/view/list.vue';
import PurchaseItemsListApp from '@/modules/purchases/items/view/list.vue';

import EditDialogApp from '@/modules/products/components/dialogs/edit.vue';
import ImagesGalleryTab from '@/modules/products/components/images-gallery.vue';

const route = useRoute();

const loadingContainer = ref<('detail')[]>([]);

const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();

const formData = ref<Product>({} as Product);

const load = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await ProductsApi.get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(load);
</script>
