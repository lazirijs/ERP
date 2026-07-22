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
            <el-button :disabled="!$hasPermission('suppliers.update')" @click="editDialogRef?.open()" text class="m-0!">
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
        <el-tabs type="border-card" :default-value="$route.query.tab || 'purchases'" @tab-change="$router.replace({ query: { tab: $event } })">
          <el-tab-pane :label="$t('purchases')" name="purchases" :disabled="!$hasPermission('purchases.access')">
            <purchases-list-app v-if="$route.query.tab === 'purchases' || !$route.query.tab" :view="{ type: 'supplier', data: formData }" @updated="load()" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="editDialogRef" :supplier_uid="formData.uid" @submitted="load()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import SuppliersApi from '@/modules/suppliers/api';
import type { Supplier } from '@/modules/suppliers/type';
import PurchasesListApp from '@/modules/purchases/view/list.vue';

import EditDialogApp from '@/modules/suppliers/components/dialogs/edit.vue';

const route = useRoute();

const loadingContainer = ref<('detail')[]>([]);

const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();

const formData = ref<Supplier>({} as Supplier);

const load = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await SuppliersApi.get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(load);
</script>
