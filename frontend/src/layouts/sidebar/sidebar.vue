<template>
    <div 
        v-if="!isCollapsed && app.isMobile" 
        class="fixed inset-0 bg-black/50 z-40" 
        @click="toggleCollapse(true)"
    />

    <aside
        class="fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-300 transition-all duration-300 md:static"
        :class="[ isCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-64' ]"
    >
        <div class="flex flex-col h-full overflow-hidden">
            <div :class="[ isCollapsed ? 'justify-center' : 'justify-between']" class="min-h-16! flex items-center border-b border-gray-300 font-bold text-xl cursor-pointer px-4">
                <span v-if="!isCollapsed">{{ $t('sidebar') }}</span>
                <el-icon @click="toggleCollapse(!isCollapsed)" :size="14">
                    <el-icon-arrow-right-bold v-if="isCollapsed" class="text-gray-500" />
                    <el-icon-arrow-left-bold v-else class="text-gray-500" />
                </el-icon>
            </div>

            <el-scrollbar>
                <el-menu
                    :default-active="$route.name?.toString().replace('-detail', '-list')"
                    :collapse="isCollapsed && !app.isMobile"
                    class="flex-1 border-none!"
                    :collapse-transition="false"
                    router
                >
                    <template v-for="item in Const.menuItems" :key="item.name">
                        <el-menu-item v-if="!item.children" :index="item.routeName!" :disabled="!canSee(item.permission)" @click="handleMenuItemClick(item.routeName!)">
                            <el-icon>
                                <component :is="item.icon" />
                            </el-icon>
                            <template #title>
                                <span dir="auto" class="w-full">
                                    {{ $t(item.name) }}
                                </span>
                            </template>
                        </el-menu-item>
                        <el-sub-menu v-else :index="item.name" :disabled="!groupEnabled(item)">
                            <template #title>
                                <el-icon>
                                    <component :is="item.icon" />
                                </el-icon>
                                <span dir="auto" class="w-full">
                                    {{ $t(item.name) }}
                                </span>
                            </template>
                            <el-menu-item v-for="child in item.children" :key="child.name" :index="child.routeName!" :disabled="!canSee(child.permission)" @click="handleMenuItemClick(child.routeName!)">
                                <el-icon>
                                    <component :is="child.icon" />
                                </el-icon>
                                <template #title>
                                    <span dir="auto" class="w-full">
                                        {{ $t(child.name) }}
                                    </span>
                                </template>
                            </el-menu-item>
                        </el-sub-menu>
                    </template>
                </el-menu>
            </el-scrollbar>
            <footer dir="auto" class="h-16 flex justify-center items-center text-center text-sm text-gray-500">
                {{ $t('version') }} 1.0.0
            </footer>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import AppStore from '@/stores/app';
import AuthStore from '@/modules/auth/store';
import Const, { type MenuItem } from './constant';

const emit = defineEmits<{
  collapsed: [boolean];
}>();

const router = useRouter();
const app = AppStore();
const authStore = AuthStore();

// Nav the user can't reach stays visible but is disabled: an item is enabled only when the
// user holds its `permission`, and a parent group only when at least one child is enabled.
const canSee = (permission?: string) => !permission || authStore.hasPermission(permission);
const groupEnabled = (item: MenuItem) => (item.children ?? []).some(child => canSee(child.permission));

// initialize collapsed state based on mobile status
const isCollapsed = ref(app.isMobile);

const toggleCollapse = (value: boolean) => {
  isCollapsed.value = value;
  localStorage.setItem('sidebarCollapsed', value.toString());
  emit('collapsed', value);
};

const checkMobile = () => app.isMobile && toggleCollapse(true);

const handleMenuItemClick = (name: string) => {
    if(app.isMobile) toggleCollapse(true);
    router.push({ name });
}

onBeforeMount(() => !app.isMobile && toggleCollapse(localStorage.sidebarCollapsed === 'true'));
onMounted(() => window.addEventListener('resize', checkMobile));
onUnmounted(() => window.removeEventListener('resize', checkMobile));

defineExpose({ toggleCollapse });
</script>