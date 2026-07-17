<template>
    <container-app type="scroll">
        <!-- Filters live in one row above the panels, and apply to whichever panel is open. -->
        <div class="flex flex-wrap items-center justify-between gap-3 sm:gap-app">
            <el-segmented v-if="!$appStore().isMobile" v-model="section" :options="sectionOptions" @change="refresh" />
            <el-select v-else v-model="section" class="w-full" @change="refresh">
                <el-option v-for="option in sectionOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>

            <div class="w-full sm:w-auto flex items-center gap-2">
                <el-date-picker
                    v-model="range"
                    type="daterange"
                    unlink-panels
                    value-format="YYYY-MM-DD"
                    :start-placeholder="$t('reportsFrom')"
                    :end-placeholder="$t('reportsTo')"
                    :shortcuts="shortcuts"
                    :clearable="false"
                    class="flex-1 sm:w-70!"
                    @change="refresh"
                />
                <el-button @click="refresh" class="w-8 m-0!">
                    <el-icon>
                        <el-icon-refresh />
                    </el-icon>
                </el-button>
            </div>
        </div>

        <div v-if="!hasAccess" class="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
            <el-icon :size="40" class="opacity-30 mb-2"><el-icon-lock /></el-icon>
            <p class="text-base font-medium text-gray-600">{{ $t('reportsNoPermission') }}</p>
        </div>

        <template v-else>
            <sales-panel v-if="section === 'sales'" ref="panelRef" :range="activeRange" />
            <cash-panel v-else-if="section === 'cash'" ref="panelRef" :range="activeRange" />
            <inventory-panel v-else-if="section === 'inventory'" ref="panelRef" :range="activeRange" />
            <hr-panel v-else-if="section === 'hr'" ref="panelRef" :range="activeRange" />
        </template>
    </container-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import AuthStore from '@/modules/auth/store';
import SalesPanel from '../components/sales-panel.vue';
import CashPanel from '../components/cash-panel.vue';
import InventoryPanel from '../components/inventory-panel.vue';
import HrPanel from '../components/hr-panel.vue';
import { sections, defaultRange, rangeFromDays, monthToDate, yearToDate, type SectionId } from '../constant';

const { t } = useI18n();
const authStore = AuthStore();

const panelRef = ref<{ refresh: () => void }>();

const range = ref<[string, string]>(defaultRange());
const activeRange = computed(() => ({ from: range.value[0], to: range.value[1] }));

// Financial sections are gated on reports.financials; the rest only need reports.access.
// No is_admin branch here on purpose: the profile endpoint already resolves an admin to
// the full permission catalog, so this stays a single question about held keys.
const availableSections = computed(() => Object.values(sections).filter(i => authStore.hasPermission(i.permission)));

const sectionOptions = computed(() => availableSections.value.map(i => ({ label: t(i.label), value: i.id })));

const section = ref<SectionId>(availableSections.value[0]?.id ?? 'sales');

const hasAccess = computed(() => availableSections.value.length > 0);

const shortcuts = [
    { text: t('reportsLast7Days'), value: () => rangeFromDays(7) },
    { text: t('reportsLast30Days'), value: () => rangeFromDays(30) },
    { text: t('reportsLast90Days'), value: () => rangeFromDays(90) },
    { text: t('reportsMonthToDate'), value: () => monthToDate() },
    { text: t('reportsYearToDate'), value: () => yearToDate() }
];

const refresh = () => setTimeout(() => panelRef.value?.refresh(), 100);

onMounted(refresh);
</script>
