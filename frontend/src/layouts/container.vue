<template>
    <el-container v-bind="$attrs" class="overflow-auto">
        <main
            :class="{ 
                'flex flex-col gap-app w-full overflow-hidden': type,
                'flex-1 w-full h-full p-app': type === 'fixed'
            }"
        >
            <el-scrollbar v-if="type == 'scroll'" class="px-6">
                <div class="space-y-2 first:mt-6 last:mb-6">
                    <slot />
                </div>
            </el-scrollbar>
            <slot v-else />
        </main>
    </el-container>
</template>

<script setup lang="ts">
import ElContainer from 'element-plus/es/components/container/index.mjs';
defineProps<{ type?: 'fixed' | 'scroll' }>();
</script>