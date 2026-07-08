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

const props = defineProps<{
  allowPresent?: boolean;
}>();

const { t } = useI18n();

const devExtremeCustomStore = new createDevExtremeCustomStore();

const gridRef = ref<InstanceType<typeof DataGridApp>>();

const statusOptions = props.allowPresent
  ? [{ id: 0, name: t('present') }, { id: 1, name: t('absent') }]
  : [{ id: 1, name: t('absent') }];

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

const gridConfig = ref<DataGridPropsConfig>({
  dataSource: [],
  columns: [
    {
      dataField: 'employee_uid',
      caption: t('employee'),
      minWidth: 160,
      lookup: {
        dataSource: devExtremeCustomStore.lookup({
          key: 'uid',
          api: async (query) => {
            const response = await EmployeeApi.getAll(query);
            // TODO: filter out employees that are already in the grid
            if (!response.success) throw new Error('Failed to load employees');
            response.detail.data = response.detail.data.filter((employee) => {
              const rows = gridRef.value?.instance?.getDataSource().items() || [];
              console.log('rows', rows);
              return !rows.some((row: any) => row.employee_uid === employee.uid);
            });
            return response;
          },
          getByKey: EmployeeApi.get
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
        } catch (error: any) {
          ElMessage.error(error?.detail?.message || t('loadingFailed'));
          console.error('Failed to fetch employee data:', error);
        }
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
  paging: { pageSize: 10 },
  pager: { showInfo: true, showNavigationButtons: true }
});

const onInitNewRow = (e: any) => {
  e.data.__id = crypto.randomUUID();
  e.data.team_uid = null;
  e.data.team_name = '';
  e.data.status = props.allowPresent ? 0 : 1;
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
