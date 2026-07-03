<template>
  <el-config-provider :locale="$appStore().selectedLocale.locale.elementPlus">
    <div class="flex h-screen bg-gray-100 overflow-hidden">
      <sidebar-app v-if="$route.meta.auth == 'required'" ref="sidebarRef" @collapsed="isCollapsed = $event" />
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header-app :is-collapsed="isCollapsed" @toggle-collapse="sidebarRef?.toggleCollapse($event)" />
        <router-view :key="$i18n.locale" />
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppStore from '@/stores/app';
import HeaderApp from '@/layouts/header/index.vue';
import SidebarApp from '@/layouts/sidebar';

const appStore = AppStore();
const sidebarRef = ref<InstanceType<typeof SidebarApp>>();

const isCollapsed = ref(appStore.isMobile);
</script>