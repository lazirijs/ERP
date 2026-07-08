<template>
    <container-app type="fixed">
        <DxScheduler
            height="100%" width="100%"
            :data-source="[]"
            :views="['month']"
            :first-day-of-week="0"
            current-view="month"
        />
    </container-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import indexApi from '../api';

import { DxScheduler } from 'devextreme-vue/scheduler';
</script>