<template>
  <data-grid-app
    ref="gridRef"
    key-expr="__id"
    height="55vh"
    :config="gridConfig"
    @init-new-row="onInitNewRow"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import EmployeeApi from '@/modules/employees/api';
import { createDevExtremeCustomStore } from '@/components/devextreme/service';
import DataGridApp from '@/components/devextreme/datagrid/index.vue';
import type { DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import { ElMessage } from 'element-plus';
import type { DxDataGridTypes } from 'devextreme-vue/cjs/data-grid';
import type { Employee } from '@/modules/employees/type';
import { previewImage } from '@/services/files';

const props = defineProps<{
  allowPresent?: boolean;
}>();

const { t } = useI18n();

const gridRef = ref<InstanceType<typeof DataGridApp>>();
const devExtremeCustomStore = new createDevExtremeCustomStore();

// Employee uids already picked in the grid (pending inserts live in `editing.changes`,
// committed rows in the store). Optionally exclude the row currently being edited so its
// own selection stays visible.
const takenEmployeeIds = (excludeId?: string) => {
  const instance = gridRef.value?.instance;
  const ids = new Set<string>();
  if (!instance) return ids;
  for (const change of ((instance.option('editing.changes') as any[]) || [])) {
    if (change?.data?.employee_uid && change.data.__id !== excludeId) ids.add(change.data.employee_uid);
  }
  for (const row of ((instance.getDataSource().items() as any[]) || [])) {
    if (row?.employee_uid && row.__id !== excludeId) ids.add(row.employee_uid);
  }
  return ids;
};

const statusOptions = props.allowPresent
  ? [{ id: 0, name: t('present') }, { id: 1, name: t('absent') }]
  : [{ id: 1, name: t('absent') }];

const gridConfig = ref<DataGridPropsConfig>({
  dataSource: [],
  columns: [
    {
      dataField: 'employee_uid',
      caption: t('employee'),
      minWidth: 160,
      lookup: {
        dataSource: (options: any) => devExtremeCustomStore.lookup({
          key: 'uid',
          api: async (query) => {
            const response = await EmployeeApi.getAll(query);
            const taken = takenEmployeeIds(options?.data?.__id);
            const filtered = response.detail.data.filter((employee: Employee) => !taken.has(employee.uid));
            response.detail.data = filtered;
            response.detail.totalCount = filtered.length;
            return response;
          },
          getByKey: EmployeeApi.get
        }, {
          loadMode: 'processed',
          cacheRawData: false
        }),
        valueExpr: 'uid',
        displayExpr: 'name'
      },
      validationRules: [{ type: 'required' }],
      // Fetch the selected employee so the team column can autofill
      setCellValue: async (newData: any, value: any) => {
        newData.employee_uid = value;
        newData.team_uid = null;
        newData.team_name = '';
        if (value) try {
          const employee = await EmployeeApi.get(value);
          newData.team_uid = employee.detail.team?.uid ?? null;
          newData.team_name = employee.detail.team?.name ?? '';
          newData.image = employee.detail.image ?? '';
        } catch (error: any) {
          ElMessage.error(error?.detail?.message || t('loadingFailed'));
          console.error('Failed to fetch employee data:', error);
        }
      }
    },
    {
      dataField: 'image', caption: t('image'), allowSorting: false, alignment: 'center', width: 120,
      cellTemplate: (container: HTMLElement, options: { value: string }) => {
        container.innerHTML = previewImage({ type: 'avatar', src: options.value, format: 'html' });
      }
    },
    {
      dataField: 'team_name', caption: t('team'), allowSorting: false, allowEditing: false, minWidth: 140
    },
    {
      dataField: 'status',
      caption: t('status'),
      minWidth: 130,
      lookup: { dataSource: statusOptions, valueExpr: 'id', displayExpr: 'name' },
      validationRules: [{ type: 'required' }]
    },
    {
      dataField: 'note',
      caption: t('note'),
      minWidth: 140
    }
  ],
  editing: {
    mode: 'batch',
    allowAdding: true,
    allowUpdating: true,
    allowDeleting: true,
    useIcons: true,
    startEditAction: 'click'
  },
  toolbar: { visible: false },
});

const onInitNewRow = ({ data }: DxDataGridTypes.InitNewRowEvent) => {
  data.__id = crypto.randomUUID();
  data.team_uid = null;
  data.team_name = '';
  data.status = props.allowPresent ? 0 : 1;
};

// Save pending edits, validate, and return the plain rows (without internal keys)
const getRows = async () => {
  const instance = gridRef.value?.instance;
  if (!instance) return [];
  await instance.saveEditData();
  if (instance.hasEditData()) throw new Error('invalid');
  const all = await instance.getDataSource().store().load() as any[];
  return all.map(({ __id, team_name, ...rest }: any) => ({
    ...rest,
    note: rest.note ?? '',
    team_uid: rest.team_uid ?? null
  }));
};

const reset = () => {
  gridConfig.value.dataSource = [];
  gridRef.value?.instance?.cancelEditData();
};

const addRow = () => {
  gridRef.value?.instance?.addRow();
};

defineExpose({ getRows, reset, addRow });
</script>
