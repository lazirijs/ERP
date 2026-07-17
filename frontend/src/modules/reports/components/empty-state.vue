<template>
    <div class="flex flex-col items-center justify-center py-10 gap-1 text-gray-400">
        <el-icon :size="24" class="opacity-30">
            <el-icon-data-line />
        </el-icon>
        <p class="text-sm">{{ props.message || $t('reportsNoData') }}</p>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ message?: string }>();
</script>
