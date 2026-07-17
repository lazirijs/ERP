<template>
    <div class="flex flex-col gap-app">
        <!-- KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <kpi-card :label="$t('reportsStockValue')" :value="$formatter.currency(data?.kpis.stock_value)" :hint="$t('reportsStockValueHint')" :loading="loading" />
            <kpi-card :label="$t('reportsStockQuantity')" :value="data?.kpis.stock_quantity ?? 0" :hint="$t('reportsStockQuantityHint')" :loading="loading" />
            <kpi-card :label="$t('reportsOutOfStock')" :value="data?.kpis.out_of_stock_count ?? 0" :hint="$t('reportsProductsCountHint', { count: data?.kpis.products_count ?? 0 })" :loading="loading" />
            <kpi-card :label="$t('reportsPurchaseSpend')" :value="$formatter.currency(data?.kpis.purchase_spend)" :color="palette.orange" :loading="loading" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-app">
            <!-- Stock value by product: magnitude across named items, one series. -->
            <div v-loading="loading" class="rounded-md border border-gray-200 bg-white p-4">
                <h3 dir="auto" class="text-sm font-medium text-gray-700 mb-3">{{ $t('reportsTopProductsByStockValue') }}</h3>
                <!-- <el-skeleton v-if="loading" :rows="4" animated /> -->
                <empty-state v-if="!data?.top_products.length" />
                <dx-chart v-else :data-source="data.top_products" :rotated="true" height="260">
                    <dx-series argument-field="name" value-field="stock_value" :name="$t('reportsStockValue')" type="bar" :color="palette.blue" :bar-padding="0.3" />
                    <dx-value-axis :label="{ customizeText: valueAxisText }" />
                    <dx-legend :visible="false" />
                    <dx-tooltip :enabled="true" :customize-tooltip="currencyTooltip" />
                </dx-chart>
            </div>

            <div v-loading="loading" class="rounded-md border border-gray-200 bg-white p-4">
                <h3 dir="auto" class="text-sm font-medium text-gray-700 mb-3">{{ $t('reportsSpendBySupplier') }}</h3>
                <!-- <el-skeleton v-if="loading" :rows="4" animated /> -->
                <empty-state v-if="!data?.suppliers.length" />
                <el-table v-else :data="data.suppliers" size="small">
                    <el-table-column prop="name" :label="$t('supplier')" show-overflow-tooltip>
                        <template #default="{ row }">
                            <span>{{ row.name || $t('reportsNoSupplier') }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="purchases_count" :label="$t('reportsPurchasesCount')" width="90" align="center" />
                    <el-table-column :label="$t('reportsAmount')" align="right" width="140">
                        <template #default="{ row }">
                            <span class="tabular-nums">{{ $formatter.currency(row.amount) }}</span>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DxChart, { DxSeries, DxValueAxis, DxLegend, DxTooltip } from 'devextreme-vue/chart';
import ReportApi from '../api';
import KpiCard from './kpi-card.vue';
import EmptyState from './empty-state.vue';
import { palette } from '../constant';
import formatter from '@/services/formatter';
import type { ReportRange, InventoryReport } from '../type';

const props = defineProps<{ range: ReportRange }>();

const data = ref<InventoryReport>();
const loading = ref(true);

const valueAxisText = ({ value }: { value: number }) => formatter.currency(value, false);
const currencyTooltip = (info: any) => ({ text: `${ info.argument }: ${ formatter.currency(info.value) }` });

const load = async () => {
    loading.value = true;
    try {
        const response = await ReportApi.inventory(props.range);
        if (response.success) data.value = response.detail;
    } finally {
        loading.value = false;
    }
};

defineExpose({ refresh: load });
</script>
