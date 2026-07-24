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
            <el-button @click="onEdit" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div dir="auto" class="space-y-app">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('attendanceDate') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.date }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalEmployees') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.total_employees }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalAbsence') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.total_absence }}</span>
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
        <el-tabs type="border-card" :default-value="$route.query.tab || 'employees'" @tab-change="$router.replace({ query: { tab: $event } })">
          <el-tab-pane :label="$t('employees')" name="employees">
            <session-employees-list v-if="$route.query.tab === 'employees' || !$route.query.tab" :session="formData" :hideCreate="!editable" @updated="load()" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <edit-dialog-app ref="editDialogRef" :uid="formData.uid" @submitted="load()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';

import sessionsApi from '@/modules/sessions/api';
import type { Session } from '@/modules/sessions/type';
import EditDialogApp from '@/modules/sessions/components/dialogs/edit.vue';
import SessionEmployeesList from '@/modules/sessions/employees/view/list.vue';

const { t } = useI18n();
const route = useRoute();

const loadingContainer = ref<('detail')[]>(['detail']);

const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();

const formData = ref<Session>({} as Session);

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const editable = computed(() => !!formData.value.date && formData.value.date >= todayStr());

const onEdit = () => {
  if (!editable.value) return ElMessage.warning(t('cannotEditPastSession'));
  editDialogRef.value?.open();
};

const load = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await sessionsApi.get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(load);
</script>