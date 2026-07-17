<template>
    <div class="flex flex-col gap-app">
        <!-- KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <kpi-card :label="$t('reportsAttendanceRate')" :value="`${ data?.kpis.attendance_rate ?? 0 }%`" :loading="loading" />
            <kpi-card :label="$t('reportsPresent')" :value="data?.kpis.present ?? 0" :color="palette.blue" :loading="loading" />
            <kpi-card :label="$t('reportsAbsent')" :value="data?.kpis.absent ?? 0" :color="palette.orange" :loading="loading" />
            <kpi-card :label="$t('reportsSessionsCount')" :value="data?.kpis.sessions_count ?? 0" :hint="$t('reportsEmployeesCountHint', { count: data?.kpis.employees_count ?? 0 })" :loading="loading" />
        </div>

        <!-- Present and absent are parts of one whole (everyone marked that day), so they
             stack: the bar height is the session's headcount. -->
        <div v-loading="loading" class="rounded-md border border-gray-200 bg-white p-4">
            <h3 dir="auto" class="text-sm font-medium text-gray-700 mb-3">{{ $t('reportsAttendanceOverTime') }}</h3>
            <!-- <el-skeleton v-if="loading" :rows="4" animated /> -->
            <empty-state v-if="!data?.series.length" />
            <dx-chart v-else :data-source="data.series" height="280">
                <dx-common-series-settings argument-field="date" type="stackedbar" :bar-padding="0.3" />
                <dx-series value-field="present" :name="$t('reportsPresent')" :color="palette.blue" />
                <dx-series value-field="absent" :name="$t('reportsAbsent')" :color="palette.orange" />
                <dx-argument-axis argument-type="datetime" :label="{ format: 'MMM dd' }" />
                <dx-legend vertical-alignment="top" horizontal-alignment="right" />
                <dx-tooltip :enabled="true" :shared="true" />
            </dx-chart>
        </div>

        <div v-loading="loading" class="rounded-md border border-gray-200 bg-white p-4">
            <h3 dir="auto" class="text-sm font-medium text-gray-700 mb-3">{{ $t('reportsByTeam') }}</h3>
            <!-- <el-skeleton v-if="loading" :rows="4" animated /> -->
            <empty-state v-if="!data?.teams.length" />
            <el-table v-else :data="data.teams" size="small">
                <el-table-column prop="name" :label="$t('team')" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span>{{ row.name || $t('noTeam') }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="present" :label="$t('reportsPresent')" width="90" align="center" />
                <el-table-column prop="absent" :label="$t('reportsAbsent')" width="90" align="center" />
                <el-table-column :label="$t('reportsAttendanceRate')" align="right" width="120">
                    <template #default="{ row }">
                        <span class="tabular-nums">{{ row.attendance_rate }}%</span>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DxChart, { DxSeries, DxCommonSeriesSettings, DxArgumentAxis, DxLegend, DxTooltip } from 'devextreme-vue/chart';
import ReportApi from '../api';
import KpiCard from './kpi-card.vue';
import EmptyState from './empty-state.vue';
import { palette } from '../constant';
import type { ReportRange, HrReport } from '../type';

const props = defineProps<{ range: ReportRange }>();

const data = ref<HrReport>();
const loading = ref(true);

const load = async () => {
    loading.value = true;
    try {
        const response = await ReportApi.hr(props.range);
        if (response.success) data.value = response.detail;
    } finally {
        loading.value = false;
    }
};

defineExpose({ refresh: load });
</script>
