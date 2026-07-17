<template>
    <div v-loading="props.loading" class="flex flex-col gap-1 px-4 py-3 rounded-md border border-gray-200 bg-white">
        <div class="flex items-center gap-2">
            <span
                v-if="props.color"
                class="w-2 h-2 rounded-full shrink-0"
                :style="{ backgroundColor: props.color }"
            />
            <span dir="auto" class="w-full text-xs font-medium text-gray-500 truncate">{{ props.label }}</span>
        </div>
        <!-- <el-skeleton v-if="props.loading" :rows="0" animated class="h-7!" /> -->
        <span dir="auto" class="text-xl font-semibold text-gray-900 truncate">{{ props.value }}</span>
        <span v-if="props.hint" dir="auto" class="text-xs text-gray-400 truncate">{{ props.hint }}</span>
    </div>
</template>

<script setup lang="ts">
// A stat tile, not a chart: a single number whose job is to be read, so it stays
// text-first. The colour dot is only present when the tile names a series that also
// appears in a chart below, and it never replaces the label.
const props = defineProps<{
    label: string
    value: string | number
    hint?: string
    color?: string
    loading?: boolean
}>();
</script>
