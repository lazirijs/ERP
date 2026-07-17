<template>
    <div class="flex flex-col gap-app">
        <!-- KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <kpi-card :label="$t('reportsRevenue')" :value="$formatter.currency(data?.kpis.revenue)" :color="palette.blue" :loading="loading" />
            <kpi-card :label="$t('reportsCogs')" :value="$formatter.currency(data?.kpis.cogs)" :color="palette.orange" :loading="loading" />
            <kpi-card :label="$t('reportsProfit')" :value="$formatter.currency(data?.kpis.profit)" :hint="$t('reportsMarginHint', { margin: data?.kpis.margin ?? 0 })" :color="palette.green" :loading="loading" />
            <kpi-card :label="$t('reportsSalesCount')" :value="data?.kpis.sales_count ?? 0" :hint="$t('reportsAverageSaleHint', { value: $formatter.currency(data?.kpis.average_sale_value) })" :loading="loading" />
        </div>

        <!-- Revenue, cost and profit share one currency scale, so they belong on one axis. -->
        <div v-loading="loading" class="rounded-md border border-gray-200 bg-white p-4">
            <h3 dir="auto" class="text-sm font-medium text-gray-700 mb-1">{{ $t('reportsRevenueOverTime') }}</h3>
            <p dir="auto" class="text-xs text-gray-400 mb-3">{{ $t('reportsCompletedOnlyHint') }}</p>
            <!-- <el-skeleton v-if="loading" :rows="4" animated /> -->
            <empty-state v-if="!data?.series.length" />
            <dx-chart v-else :data-source="data.series" height="280">
                <dx-common-series-settings argument-field="date" type="line" :point="{ size: 8 }" />
                <dx-series value-field="revenue" :name="$t('reportsRevenue')" :color="palette.blue" />
                <dx-series value-field="cogs" :name="$t('reportsCogs')" :color="palette.orange" />
                <dx-series value-field="profit" :name="$t('reportsProfit')" :color="palette.green" />
                <dx-argument-axis argument-type="datetime" :label="{ format: 'MMM dd' }" />
                <dx-value-axis :label="{ customizeText: valueAxisText }" />
                <dx-legend vertical-alignment="top" horizontal-alignment="right" />
                <dx-tooltip :enabled="true" :shared="true" :customize-tooltip="currencyTooltip" />
            </dx-chart>
        </div>

        <div v-loading="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-app">
            <!-- Magnitude compared across named products: horizontal bars, sorted, one series. -->
            <div class="rounded-md border border-gray-200 bg-white p-4">
                <h3 dir="auto" class="text-sm font-medium text-gray-700 mb-3">{{ $t('reportsTopProducts') }}</h3>
                <!-- <el-skeleton v-if="loading" :rows="4" animated /> -->
                <empty-state v-if="!data?.top_products.length" />
                <dx-chart v-else :data-source="data.top_products" :rotated="true" height="260">
                    <dx-series argument-field="name" value-field="revenue" :name="$t('reportsRevenue')" type="bar" :color="palette.blue" :bar-padding="0.3" />
                    <dx-value-axis :label="{ customizeText: valueAxisText }" />
                    <dx-legend :visible="false" />
                    <dx-tooltip :enabled="true" :customize-tooltip="currencyTooltip" />
                </dx-chart>
            </div>

            <!-- A short ranked list of names and two numbers reads better as a table than as a chart. -->
            <div v-loading="loading" class="rounded-md border border-gray-200 bg-white p-4">
                <h3 dir="auto" class="text-sm font-medium text-gray-700 mb-3">{{ $t('reportsTopClients') }}</h3>
                <!-- <el-skeleton v-if="loading" :rows="4" animated /> -->
                <empty-state v-if="!data?.top_clients.length" />
                <el-table v-else :data="data.top_clients" size="small">
                    <el-table-column prop="name" :label="$t('client')" show-overflow-tooltip />
                    <el-table-column prop="sales_count" :label="$t('reportsSalesCount')" width="90" align="center" />
                    <el-table-column :label="$t('reportsRevenue')" align="right" width="140">
                        <template #default="{ row }">
                            <span class="tabular-nums">{{ $formatter.currency(row.revenue) }}</span>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DxChart, { DxSeries, DxCommonSeriesSettings, DxArgumentAxis, DxValueAxis, DxLegend, DxTooltip } from 'devextreme-vue/chart';
import ReportApi from '../api';
import KpiCard from './kpi-card.vue';
import EmptyState from './empty-state.vue';
import { palette } from '../constant';
import formatter from '@/services/formatter';
import type { ReportRange, SalesReport } from '../type';

const props = defineProps<{ range: ReportRange }>();

const data = ref<SalesReport>();
const loading = ref(true);

const valueAxisText = ({ value }: { value: number }) => formatter.currency(value, false);
const currencyTooltip = (info: any) => ({ text: `${ info.seriesName }: ${ formatter.currency(info.value) }` });

const load = async () => {
    loading.value = true;
    try {
        const response = await ReportApi.sales(props.range);
        if (response.success) data.value = response.detail;
    } finally {
        loading.value = false;
    }
};

defineExpose({ refresh: load });
</script>
