<template>
    <container-app type="fixed">
        <DxScheduler
            height="100%" width="100%"
            :data-source="data"
            :views="['month']"
            :first-day-of-week="0"
            current-view="month"
        />
    </container-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import indexApi from '../api';
import { useI18n } from 'vue-i18n';

import type { DataGridAppRef, DataGridPropsConfig } from '@/components/devextreme/datagrid/type';
import formatter from '@/services/formatter';
import { ElMessage, ElMessageBox } from 'element-plus';
import router from '@/router';

import { DxScheduler, DxResource } from 'devextreme-vue/scheduler';

const { t } = useI18n();

const loadingContainer = ref<( 'create' )[]>([]);

const dataGridRef = ref<DataGridAppRef>();

const search = ref('');

const onSearchChange = (value: string) => {
    value = value.trim();
    setTimeout(() => {
        if (value === search.value) dataGridRef.value?.instance?.option('searchPanel.text', value);
    }, 500);
};

const dataGridConfig = ref<DataGridPropsConfig>({
    dataSource: {
        key: 'uid',
        api: indexApi.getAll
    },
    columns: [
        { dataField: 'total_present', caption: t('totalPresent') },
        { dataField: 'total_absent', caption: t('totalAbsent') },
        { dataField: 'created_at', caption: t('createdAt'), ...formatter.devextreme.datetime, sortOrder: 'desc' }
    ]
});

const create = async () => {
    await ElMessageBox.confirm(
        t('areYouSureYouWantToCreateThisAttendance?'),
        t('createAttendance'),
        {
          confirmButtonText: t('create'),
          confirmButtonType: 'primary',
          cancelButtonText: t('cancel'),
          type: 'info',
        }
    )
    try {
        loadingContainer.value.push('create');
        const response = await indexApi.create();
        if (response.success) {
            router.push({ name: 'attendances-detail', params: { uid: response.detail.uid } });
        }
    } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToCreateTeam');
        ElMessage.error(errorMessage);
    } finally {
        loadingContainer.value = loadingContainer.value.filter(item => item !== 'create');
    }
};






const employees = ref([{
  text: 'John Heart',
  id: 1,
  color: 'var(--background-color-1)',
  avatar: 'images/employees/19.png',
  age: 27,
  discipline: 'ABS, Fitball, StepFit',
}, {
  text: 'Greta Sims',
  id: 2,
  color: 'var(--background-color-2)',
  avatar: 'images/employees/31.png',
  age: 25,
  discipline: 'ABS, Fitball, StepFit',
}]);

const data = ref([
  {
    text: 'Helen',
    employeeID: 2,
    startDate: new Date('2021-06-01T16:30:00.000Z'),
    endDate: new Date('2021-06-01T18:30:00.000Z'),
  }, {
    text: 'Helen',
    employeeID: 2,
    startDate: new Date('2021-06-10T16:30:00.000Z'),
    endDate: new Date('2021-06-11T18:30:00.000Z'),
  }, {
    text: 'Alex',
    employeeID: 1,
    startDate: new Date('2021-06-02T16:30:00.000Z'),
    endDate: new Date('2021-06-02T18:30:00.000Z'),
  }, {
    text: 'Alex',
    employeeID: 1,
    startDate: new Date('2021-06-11T19:00:00.000Z'),
    endDate: new Date('2021-06-11T20:00:00.000Z'),
  }, {
    text: 'Alex',
    employeeID: 2,
    startDate: new Date('2021-06-16T16:30:00.000Z'),
    endDate: new Date('2021-06-16T18:30:00.000Z'),
  }, {
    text: 'Stan',
    employeeID: 1,
    startDate: new Date('2021-06-07T16:30:00.000Z'),
    endDate: new Date('2021-06-07T18:30:00.000Z'),
  }, {
    text: 'Stan',
    employeeID: 1,
    startDate: new Date('2021-06-28T16:30:00.000Z'),
    endDate: new Date('2021-06-28T18:30:00.000Z'),
  }, {
    text: 'Stan',
    employeeID: 1,
    startDate: new Date('2021-06-30T16:30:00.000Z'),
    endDate: new Date('2021-06-30T18:30:00.000Z'),
  }, {
    text: 'Rachel',
    employeeID: 2,
    startDate: new Date('2021-06-04T16:30:00.000Z'),
    endDate: new Date('2021-06-04T18:30:00.000Z'),
  }, {
    text: 'Rachel',
    employeeID: 2,
    startDate: new Date('2021-06-07T16:30:00.000Z'),
    endDate: new Date('2021-06-07T18:30:00.000Z'),
  }, {
    text: 'Rachel',
    employeeID: 1,
    startDate: new Date('2021-06-21T16:30:00.000Z'),
    endDate: new Date('2021-06-21T18:30:00.000Z'),
  }, {
    text: 'Kelly',
    employeeID: 2,
    startDate: new Date('2021-06-15T16:30:00.000Z'),
    endDate: new Date('2021-06-15T18:30:00.000Z'),
  }, {
    text: 'Kelly',
    employeeID: 2,
    startDate: new Date('2021-06-29T16:30:00.000Z'),
    endDate: new Date('2021-06-29T18:30:00.000Z'),
  },
]);
</script>