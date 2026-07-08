<template>
  <container-app type="scroll" v-loading="loadingContainer.includes('detail')">
    <div v-if="!loadingContainer.includes('detail')" class="grid grid-cols-1 md:grid-cols-4 items-start gap-app">
      <el-card shadow="never">
        <template #header>
          <div class="flex justify-between items-center gap-app">
            <el-button @click="$router.back()" text class="m-0!">
              <el-icon><el-icon-arrow-left /></el-icon>
            </el-button>
            <span>General Info</span>
            <el-button @click="editDialogRef?.open()" text class="m-0!">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('status') }}</label>
            <span :class="`badge-app-${status[formData.status]?.color}`">{{ $t(status[formData.status].label!) }}</span>
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
            <!-- <data-grid-app
              v-if="tab === 'attendances'"
              ref="dataGridRef"
              :config=""
              @row-click="$router.push({})"
            /> -->
          </el-tab-pane>
          <el-tab-pane :label="$t('documents')" name="documents">
            <div v-if="tab === 'documents'">Documents</div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="editDialogRef" :uid="formData.uid" @submitted="loud()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { status } from '@/modules/employees/constant';
import EditDialogApp from '../components/dialogs/edit.vue';
import type { Employee } from '../type';
import employeesApi from '../api';

const route = useRoute();

const loadingContainer = ref<('detail')[]>(['detail']);

const tab = ref('attendances');

const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();

const formData = ref<Employee>({} as Employee);

const loud = async () => {
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

onMounted(loud);
</script>