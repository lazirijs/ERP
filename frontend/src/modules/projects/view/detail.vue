<template>
  <container-app type="scroll" v-loading="loadingContainer.includes('detail')">
    <div v-if="!loadingContainer.includes('detail')" class="grid grid-cols-1 md:grid-cols-4 items-start gap-app">
      <el-card shadow="never">
        <template #header>
          <div class="flex justify-between items-center gap-app">
            <el-button @click="$router.back()" text class="m-0!">
              <el-icon><el-icon-arrow-left /></el-icon>
            </el-button>
            <span>{{ $t('generalInfo') }}</span>
            <el-button @click="editDialogRef?.open()" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div class="space-y-app">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('status') }}</label>
            <span :class="`badge-app-${status[formData.status]?.color}`">{{ $t(status[formData.status].label!) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('name') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('client') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.client.name }}</span>
          </div>
          <!-- <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('region') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.region.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('category') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.category.name }}</span>
          </div> -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('offer') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.currency(formData.offer!) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalAmountReceived') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.currency(formData.total_amount_received) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalAmountExpensed') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.currency(formData.total_amount_expensed) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalAmountSold') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.currency(formData.total_amount_sold) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('note') }}</label>
            <span v-if="formData.note" class="block text-sm text-gray-900">{{ formData.note }}</span>
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
          <el-tab-pane :label="$t('transactions')" name="transactions">
            <transaction-list-app v-if="tab === 'transactions'" :view="{ type: 'project', data: formData }" @updated="load()" />
          </el-tab-pane>
          <el-tab-pane :label="$t('sales')" name="sales">
            <sales-list-app v-if="tab === 'sales'" :view="{ type: 'project', data: formData }" @updated="load()" />
          </el-tab-pane>
          <el-tab-pane :label="$t('documents')" name="documents">
            <documents-tab v-if="tab === 'documents'" :uid="formData.uid" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="editDialogRef" :uid="formData.uid" @submitted="load()" />    
  </container-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ProjectApi from '@/modules/projects/api';
import type { Project } from '@/modules/projects/type';
import { status } from '@/modules/projects/constant';
import SalesListApp from '@/modules/sales/view/list.vue';
import DocumentsTab from '@/modules/projects/components/documents-tab.vue';
import EditDialogApp from '@/modules/projects/components/dialogs/edit.vue';
import TransactionListApp from '@/modules/transactions/view/list.vue';

const route = useRoute();

const loadingContainer = ref<('detail')[]>(['detail']);

const tab = ref('transactions');

const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();

const formData = ref<Project>({} as Project);

const load = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await ProjectApi.get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(load);
</script>