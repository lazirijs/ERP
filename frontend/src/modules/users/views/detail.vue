<template>
  <container-app type="scroll" v-loading="loadingContainer.includes('detail')">
    <div v-if="!loadingContainer.includes('detail')" class="grid grid-cols-1 md:grid-cols-4 items-start gap-app">
      <el-card shadow="never">
        <template #header>
          <div class="flex justify-between items-center gap-app">
            <el-button @click="$router.back()" text class="m-0!">
              <el-icon><el-icon-arrow-left /></el-icon>
            </el-button>
            <span>General Info</span>
            <el-button @click="" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div class="space-y-app">
          <div v-for="o in 3" :key="o">
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('item') }}</label>
            <span class="block text-sm text-gray-900">{{ o }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('createdAt') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.date(new Date().toISOString()) }}</span>
          </div>
        </div>
      </el-card>
      <div class="col-span-1 md:col-span-3 flex-1 space-y-app">        
        <el-tabs v-model="tab" type="border-card">
          <el-tab-pane :label="$t('user')" name="user">
            <div v-if="tab === 'user'">User</div>
          </el-tab-pane>
          <el-tab-pane :label="$t('config')" name="config">
            <div v-if="tab === 'config'">Config</div>
          </el-tab-pane>
          <el-tab-pane :label="$t('role')" name="role">
            <div v-if="tab === 'role'">Role</div>
          </el-tab-pane>
          <el-tab-pane :label="$t('task')" name="task">
            <div v-if="tab === 'task'">Task</div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </container-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const loadingContainer = ref<('detail')[]>([]);

const tab = ref('user');
</script>