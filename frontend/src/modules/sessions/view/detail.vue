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
            <el-button @click="onEdit" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div class="space-y-app">
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
        <el-tabs v-model="tab" type="border-card">
          <el-tab-pane :label="$t('employees')" name="employees">
            <div v-if="tab === 'employees'" class="flex flex-col items-end gap-4">
              <el-button v-if="editable" @click="onAdd" type="success">
                {{ $t('addEmployees') }}
                <el-icon class="ml-2">
                  <el-icon-plus />
                </el-icon>
              </el-button>
              <data-grid-app
                ref="dataGridRef"
                :config="employeesDataGridConfig"
                @row-click="onRowClick($event)"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <edit-dialog-app ref="editDialogRef" :uid="formData.uid" @submitted="load()" />
    <batch-add-dialog-app ref="batchAddDialogRef" :session_uid="formData.uid" :allow-present="allowPresent" @submitted="onEmployeesChanged()" />
    <row-edit-dialog-app ref="rowEditDialogRef" :uid="editingRowUid" :allow-present="allowPresent" @submitted="onEmployeesChanged()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';

import sessionsApi from '../api';
import sessionEmployeesApi from '../employees/api';
import type { Session } from '../type';
import type { SessionEmployee } from '../employees/type';
import ConstSession from '../constant';

import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';

import EditDialogApp from '../components/dialogs/edit.vue';
import BatchAddDialogApp from '../employees/components/dialogs/batch-add.vue';
import RowEditDialogApp from '../employees/components/dialogs/edit.vue';
import { previewImage } from '@/services/files.ts';

const { t } = useI18n();
const route = useRoute();

const loadingContainer = ref<('detail')[]>(['detail']);

const tab = ref('employees');

const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();
const batchAddDialogRef = ref<InstanceType<typeof BatchAddDialogApp>>();
const rowEditDialogRef = ref<InstanceType<typeof RowEditDialogApp>>();
const dataGridRef = ref<DataGridAppRef>();

const editingRowUid = ref('');

const formData = ref<Session>({} as Session);

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const editable = computed(() => !!formData.value.date && formData.value.date >= todayStr());
const allowPresent = computed(() => !!formData.value.date && formData.value.date <= todayStr());

const onEdit = () => {
  if (!editable.value) return ElMessage.warning(t('cannotEditPastSession'));
  editDialogRef.value?.open();
};

const onAdd = () => {
  if (!editable.value) return ElMessage.warning(t('cannotEditPastSession'));
  batchAddDialogRef.value?.open();
};

const onRowClick = (event: any) => {
  if (!editable.value) return ElMessage.warning(t('cannotEditPastSession'));
  editingRowUid.value = event.data.uid;
  rowEditDialogRef.value?.open(event.data.uid);
};

const onEmployeesChanged = () => {
  dataGridRef.value?.instance?.refresh();
  load();
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

const employeesDataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => sessionEmployeesApi.getAll({ ...query, session_uid: route.params.uid as string })
  },
  columns: [
    {
      dataField: 'employee.image', caption: t('image'), allowSorting: false, alignment: 'center', width: 120,
      cellTemplate: (container: HTMLElement, options: { value: string }) => {
        container.innerHTML = previewImage({ type: 'avatar', src: options.value, format: 'html' });
      }
    },
    { dataField: 'employee.name', caption: t('employee'), allowSorting: false },
    { dataField: 'team.name', caption: t('team'), allowSorting: false },
    {
      dataField: 'status', caption: t('status'), alignment: 'center',
      cellTemplate: (container: HTMLElement, options: { value: SessionEmployee['status'] }) => {
        const { label, color } = ConstSession.status[options.value];
        container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
      }
    },
    { dataField: 'note', caption: t('note') },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
  ]
});
</script>
