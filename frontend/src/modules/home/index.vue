<template>
  <container-app type="scroll">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-6 mb-10">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight mb-1">
          Good {{ timeOfDay }}, {{ $authStore().profile?.name }} 👋
        </h1>
        <p class="w-3/4 md:w-full text-sm text-gray-500">
          Here's a quick overview of everything you have access to as {Role}.
        </p>
      </div>
      <div class="w-full md:w-56">
        <el-input
          v-model="search"
          placeholder="Search modules..."
          clearable
        >
          <template #prefix>
            <el-icon><el-icon-search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="filteredMenuItems.length === 0"
      class="flex flex-col items-center justify-center py-20 gap-2 text-gray-400"
    >
      <el-icon :size="40" class="opacity-30 mb-2"><el-icon-search /></el-icon>
      <p class="text-base font-medium text-gray-600">No modules found</p>
      <p class="text-sm">Try a different search term.</p>
    </div>

    <!-- Modules grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="(item, index) in filteredMenuItems.slice(1)" :key="index"
        @click="$router.push({ name: item.routeName })"
        class="group flex items-center gap-4 px-4 py-4 rounded-md border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm hover:-translate-y-px transition-all no-underline cursor-pointer"
      >
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
        </div>
        <span class="flex-1 text-sm font-medium text-gray-700 capitalize">
          {{ item.name }}
        </span>
        <el-icon class="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
          <el-icon-arrow-right />
        </el-icon>
      </div>
    </div>
  </container-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ConstSideBar from '@/layouts/sidebar/constant.ts'

const search = ref('');

const timeOfDay = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
})

const filteredMenuItems = computed(() => {
  const query = search.value.toLowerCase().trim();

  const flattenedItems: any[] = ConstSideBar.menuItems.flatMap(item => 
    item.children ? item.children : item
  )
  .filter(item => item.name.toLowerCase().includes(query))

  if (!query) return flattenedItems;

  return flattenedItems
})
</script>