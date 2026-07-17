<template>
    <div class="grid gap-app">
        <div class="flex justify-between items-center gap-3 sm:gap-app">
            <div class="w-full sm:w-auto flex items-center gap-2">
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
            <el-button v-if="!hideCreate" @click="onAdd" class="w-8 sm:w-auto m-0!" type="success">
                <span class="hidden sm:block">{{ $t('create') }}</span>
                <el-icon class="sm:ml-2">
                    <el-icon-plus />
                </el-icon>
            </el-button>
        </div>
        <div class="flex-1 min-h-0 min-w-0">
            <data-grid-app
                ref="dataGridRef"
                :config="dataGridConfig"
                @row-click="onRowClick($event)"
            />
        </div>
        <batch-add-dialog-app ref="batchAddDialogRef" :session_uid="props.session.uid" :allow-present="allowPresent" @submitted="onEmployeesChanged()" />
        <row-edit-dialog-app ref="rowEditDialogRef" :allow-present="allowPresent" @submitted="onEmployeesChanged()" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import sessionEmployeesApi from '@/modules/sessions/employees/api';
import type { Session } from '@/modules/sessions/type';
import type { SessionEmployee } from '@/modules/sessions/employees/type';
import ConstSession from '@/modules/sessions/constant';
import { createDevExtremeCustomStore } from '@/components/devextreme/service.ts';

import RowEditDialogApp from '@/modules/sessions/employees/components/dialogs/edit.vue';
import BatchAddDialogApp from '@/modules/sessions/employees/components/dialogs/batch-add.vue';

import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';
import { previewImage } from '@/services/files';
import { ElMessage } from 'element-plus';
import TeamApi from '@/modules/teams/api';
import type { Team } from '@/modules/teams/type';
import EmployeeApi from '@/modules/employees/api';
import type { Employee } from '@/modules/employees/type';

const emit = defineEmits<{
  (e: 'updated'): void;
}>();

const props = defineProps<{
    session: Session;
    hideCreate?: boolean;
}>();

const { t } = useI18n();

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const dataGridRef = ref<DataGridAppRef>();
const rowEditDialogRef = ref<InstanceType<typeof RowEditDialogApp>>();
const batchAddDialogRef = ref<InstanceType<typeof BatchAddDialogApp>>();

const editable = computed(() => !!props.session.date && props.session.date >= todayStr());
const allowPresent = computed(() => !!props.session.date && props.session.date <= todayStr());

const search = ref('');

const onSearchChange = (value: string) => {
    value = value.trim();
    setTimeout(() => value === search.value && dataGridRef.value?.instance?.searchByText(value), 500);
};

const toggleFilterRowVisibility = () => {
    dataGridRef.value?.instance?.option('filterRow.visible', !dataGridRef.value?.instance?.option('filterRow.visible'));
};

const onAdd = () => {
  if (!editable.value) return ElMessage.warning(t('cannotEditPastSession'));
  batchAddDialogRef.value?.open();
};

const onRowClick = (event: any) => {
  if (!editable.value) return ElMessage.warning(t('cannotEditPastSession'));
  rowEditDialogRef.value?.open(event.data.uid);
};

const devExtremeCustomStore = new createDevExtremeCustomStore();

const dataGridConfig = ref<DataGridPropsConfig>({
  dataSource: {
    key: 'uid',
    api: (query) => {
        const filters = query.filters || [];
        filters.push({
          field: 'session.name',
          operation: '=',
          values: [props.session.uid as string]
        });
        return sessionEmployeesApi.getAll({ ...query, filters });
    },
  },
  headerFilter: { visible: true },
  columns: [
    {
      dataField: 'employee.image', caption: t('image'), alignment: 'center', width: 120,
      allowSorting: false, allowHeaderFiltering: false, allowFiltering: false,
      cellTemplate: (container: HTMLElement, options: { value: string }) => {
        container.innerHTML = previewImage({ type: 'avatar', src: options.value, format: 'html' });
      },
    },
    { dataField: 'employee.name', caption: t('employee'), allowSorting: false,
        headerFilter: {
            dataSource: devExtremeCustomStore.lookup({
                key: 'value',
                api: EmployeeApi.getAll,
                map: (i: Employee) => ({ value: i.uid, text: i.name })
            })
        }
    },
    { dataField: 'team.name', caption: t('team'), allowSorting: false,
        headerFilter: {
            dataSource: devExtremeCustomStore.lookup({
                key: 'value',
                api: TeamApi.getAll,
                map: (i: Team) => ({ value: i.uid, text: i.name })
            })
        }
    },
    {
        dataField: 'status', caption: t('status'), alignment: 'center', allowHeaderFiltering: true, allowFiltering: false,
        cellTemplate: (container: HTMLElement, options: { value: SessionEmployee['status'] }) => {
            const { label, color } = ConstSession.status[options.value];
            container.innerHTML = `<span class="badge-app-${ color }">${ t(label) }</span>`;
        },
        headerFilter: { dataSource: Object.values(ConstSession.status).map(i => ({ value: i.id, text: t(i.label) })) },
    },
    { dataField: 'note', caption: t('note'), allowHeaderFiltering: false },
    { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc', allowHeaderFiltering: false }
  ]
});

const onEmployeesChanged = () => {
  dataGridRef.value?.instance?.refresh();
  emit('updated');
};
</script>