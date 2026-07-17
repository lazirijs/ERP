<template>
    <div class="flex flex-col gap-app">
        <!-- KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <kpi-card :label="$t('reportsAmountIn')" :value="$formatter.currency(data?.kpis.amount_in)" :color="palette.green" :loading="loading" />
            <kpi-card :label="$t('reportsAmountOut')" :value="$formatter.currency(data?.kpis.amount_out)" :color="palette.red" :loading="loading" />
            <kpi-card :label="$t('reportsNet')" :value="$formatter.currency(data?.kpis.net)" :hint="netHint" :loading="loading" />
            <kpi-card :label="$t('reportsTransactionsCount')" :value="data?.kpis.transactions_count ?? 0" :loading="loading" />
        </div>

        <!-- Money in and money out are opposite signs of one flow, so they sit on one axis
             as side-by-side bars rather than two stacked or dual-scaled series. -->
        <div v-loading="loading" class="rounded-md border border-gray-200 bg-white p-4">
            <h3 dir="auto" class="text-sm font-medium text-gray-700 mb-3">{{ $t('reportsCashOverTime') }}</h3>
            <!-- <el-skeleton v-if="loading" :rows="4" animated /> -->
            <empty-state v-if="!data?.series.length" />
            <dx-chart v-else :data-source="data.series" height="280">
                <dx-common-series-settings argument-field="date" type="bar" :bar-padding="0.3" />
                <dx-series value-field="amount_in" :name="$t('reportsAmountIn')" :color="palette.green" />
                <dx-series value-field="amount_out" :name="$t('reportsAmountOut')" :color="palette.red" />
                <dx-argument-axis argument-type="datetime" :min-tick-interval="{ days: 1 }" :label="{ format: 'MMM dd' }" />
                <dx-value-axis :label="{ customizeText: valueAxisText }" />
                <dx-legend vertical-alignment="top" horizontal-alignment="right" />
                <dx-tooltip :enabled="true" :shared="true" :customize-tooltip="currencyTooltip" />
            </dx-chart>
        </div>

        <!-- Balance is all-time, in/out are range-scoped: different meanings, so they are
             labelled rather than charted together. -->
        <div v-loading="loading" class="rounded-md border border-gray-200 bg-white p-4">
            <h3 dir="auto" class="text-sm font-medium text-gray-700 mb-1">{{ $t('reportsByAccount') }}</h3>
            <p dir="auto" class="text-xs text-gray-400 mb-3">{{ $t('reportsBalanceAllTimeHint') }}</p>
            <!-- <el-skeleton v-if="loading" :rows="4" animated /> -->
            <empty-state v-if="!data?.accounts.length" />
            <el-table v-else :data="data.accounts" size="small">
                <el-table-column prop="name" :label="$t('account')" show-overflow-tooltip />
                <el-table-column :label="$t('reportsAmountIn')" align="right">
                    <template #default="{ row }">
                        <span class="tabular-nums">{{ $formatter.currency(row.amount_in) }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('reportsAmountOut')" align="right">
                    <template #default="{ row }">
                        <span class="tabular-nums">{{ $formatter.currency(row.amount_out) }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('reportsBalance')" align="right">
                    <template #default="{ row }">
                        <span class="tabular-nums font-medium" :class="row.balance < 0 ? 'text-red-600' : 'text-gray-900'">
                            {{ $formatter.currency(row.balance) }}
                        </span>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import DxChart, { DxSeries, DxCommonSeriesSettings, DxArgumentAxis, DxValueAxis, DxLegend, DxTooltip } from 'devextreme-vue/chart';
import { useI18n } from 'vue-i18n';
import ReportApi from '../api';
import KpiCard from './kpi-card.vue';
import EmptyState from './empty-state.vue';
import { palette } from '../constant';
import formatter from '@/services/formatter';
import type { ReportRange, CashReport } from '../type';

const props = defineProps<{ range: ReportRange }>();

const { t } = useI18n();

const data = ref<CashReport>();
const loading = ref(true);

const netHint = computed(() => {
    if (!data.value) return '';
    return data.value.kpis.net >= 0 ? t('reportsNetPositive') : t('reportsNetNegative');
});

const valueAxisText = ({ value }: { value: number }) => formatter.currency(value, false);
const currencyTooltip = (info: any) => ({ text: `${ info.seriesName }: ${ formatter.currency(info.value) }` });

const load = async () => {
    loading.value = true;
    try {
        const response = await ReportApi.cash(props.range);
        if (response.success) data.value = response.detail;
    } finally {
        loading.value = false;
    }
};

defineExpose({ refresh: load });
</script>
