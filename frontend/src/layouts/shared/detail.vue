<template>
  <container-app type="scroll" v-loading="props.config.loadingContainer?.includes('detail')">
    <div v-if="!props.config.loadingContainer?.includes('detail')" class="grid grid-cols-1 md:grid-cols-4 items-start gap-app">
      <el-card shadow="never">
        <template #header>
          <div class="flex justify-between items-center gap-app">
            <el-button @click="$router.back()" text class="m-0!">
              <el-icon><el-icon-arrow-left /></el-icon>
            </el-button>
            <span class="truncate">{{ $t('generalInfo') }}</span>
            <el-button :disabled="props.config.editPermission && !$hasPermission(props.config.editPermission)" @click="emit('edit')" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div dir="auto" class="space-y-app">
          <div v-for="(menu, index) in props.config.sideBar.filter(item => !item.permission || $hasPermission(item.permission))" :key="index">
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ menu.label }}</label>
            <span v-if="'badge' in menu" :class="`badge-app-${menu.badge.color}`">{{ menu.badge.value }}</span>
            <span v-else-if="menu.value" class="block text-sm text-gray-900">{{ menu.value }}</span>
            <span v-else class="block text-sm text-gray-400">{{ $t('notProvided') }}</span>
          </div>
        </div>
      </el-card>
      <div class="col-span-1 md:col-span-3 flex-1 space-y-app">
        <el-tabs type="border-card" :default-value="activeTab" @tab-change="$router.replace({ query: { tab: $event } })">
          <el-tab-pane v-for="tab in props.config.tabs" :key="tab" :label="tab.label || $t(tab.name)" :name="tab.name" :disabled="tab.permission && !$hasPermission(tab.permission)">
            <slot :name="'tab-' + tab.name" v-if="activeTab === tab.name" />
          </el-tab-pane>
        </el-tabs>
      </div>
      <slot name="edit-dialog" v-if="!props.config.editPermission || $hasPermission(props.config.editPermission)" />
    </div>
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import AuthStore from '@/modules/auth/store';
import { useRoute } from 'vue-router';

const props = defineProps<{
    config: {
        sideBar: (
            {
                label: string;
                permission?: string;
            } &
            ( |
                {
                    value: any;
                } |
                {
                    badge: {
                        value: any;
                        color: string;
                    };
                }
            )
        )[];
        tabs: { name: string; label?: string; permission?: string }[];
        editPermission?: string;
        loadingContainer?: string[];
        load: () => Promise<void>;
    }
}>();

const emit = defineEmits<{
    edit: []
}>();

const route = useRoute();
const authStore = AuthStore();

// Land on the first tab the user can actually open (documents is always available as a fallback).
const defaultTab = computed(() => {
  return (props.config.tabs.find(t => !t.permission || authStore.hasPermission(t.permission)) ?? props.config.tabs[0]).name;
});

const activeTab = computed(() => (route.query.tab as string) || defaultTab.value);

onMounted(props.config.load);

defineExpose({ load: props.config.load });
</script>