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
            <el-button @click="editDialogRef?.open()" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div class="space-y-app">
          <img :src="$previewImage({ type: 'avatar', src: formData.image })" class="size-32 mx-auto rounded-full object-cover border border-gray-200" />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('status') }}</label>
            <span :class="`badge-app-${status[formData.status]?.color}`">{{ $t(status[formData.status].label!) }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('name') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('team') }}</label>
            <span v-if="formData.team" class="block text-sm text-gray-900">{{ formData.team.name }}</span>
            <span v-else class="block text-sm text-gray-400">{{ $t('noTeam') }}</span>
          </div>          
          <!-- <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('monthlySalary') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.currency(formData.monthly_salary) }}</span>
          </div> -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('createdAt') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.date(formData.created_at) }}</span>
          </div>
        </div>
      </el-card>
      <div class="col-span-1 md:col-span-3 flex-1 space-y-app">
        <el-tabs v-model="tab" type="border-card">
          <el-tab-pane :label="$t('attendances')" name="attendances">
            <attendances-tab v-if="tab === 'attendances' && formData.uid" :employee_uid="formData.uid" />
          </el-tab-pane>
          <el-tab-pane :label="$t('transactions')" name="transactions">
            <transaction-list-app v-if="tab === 'transactions'" :view="{ type: 'employee', data: formData }" :hide-create="formData.status === 1" />
          </el-tab-pane>
          <el-tab-pane :label="$t('documents')" name="documents">
            <documents-tab v-if="tab === 'documents' && formData.uid" :uid="formData.uid" @changed="load()" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="editDialogRef" :uid="formData.uid" @submitted="load()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { status } from '@/modules/employees/constant';
import EditDialogApp from '../components/dialogs/edit.vue';
import DocumentsTab from '../components/documents-tab.vue';
import AttendancesTab from '../components/attendances-tab.vue';
import type { Employee } from '../type';
import employeesApi from '../api';
import TransactionListApp from '@/modules/transactions/view/list.vue';

const route = useRoute();

const loadingContainer = ref<('detail')[]>(['detail']);

const tab = ref('attendances');

const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();

const formData = ref<Employee>({} as Employee);

const load = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await employeesApi.get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(load);
</script>