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
            <el-button @click="editDialogRef?.open()" text class="m-0!">
              <el-icon><el-icon-edit /></el-icon>
            </el-button>
          </div>
        </template>
        <div class="space-y-app">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('name') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.name }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('contact') }}</label>
            <span v-if="formData.contact" class="block text-sm text-gray-900">{{ formData.contact }}</span>
            <span v-else class="block text-sm text-gray-400">{{ $t('notProvided') }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('address') }}</label>
            <span v-if="formData.address" class="block text-sm text-gray-900">{{ formData.address }}</span>
            <span v-else class="block text-sm text-gray-400">{{ $t('notProvided') }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('totalProjects') }}</label>
            <span class="block text-sm text-gray-900">{{ formData.total_projects }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('createdAt') }}</label>
            <span class="block text-sm text-gray-900">{{ $formatter.date(formData.created_at) }}</span>
          </div>
        </div>
      </el-card>
      <div class="col-span-1 md:col-span-3 flex-1 space-y-app">
        <el-tabs v-model="tab" type="border-card">
          <el-tab-pane :label="$t('projects')" name="projects">
            <projects-list-app v-if="tab === 'projects'" :view="{ type: 'client', data: formData }" @updated="load()" />
          </el-tab-pane>
          <el-tab-pane :label="$t('sales')" name="sales">
            <sales-list-app v-if="tab === 'sales'" :view="{ type: 'client', data: formData }" @updated="load()" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="editDialogRef" :client_uid="formData.uid" @submitted="load()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import ClientApi from '@/modules/clients/api';
import type { Client } from '@/modules/clients/type';
import SalesListApp from '@/modules/sales/view/list.vue';
import EditDialogApp from '@/modules/clients/components/dialogs/edit.vue';
import ProjectsListApp from '@/modules/projects/view/list.vue';

const route = useRoute();

const loadingContainer = ref<('detail')[]>([]);

const tab = ref('projects');

const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();

const formData = ref<Client>({} as Client);

const load = async () => {
  try {
    loadingContainer.value.push('detail');
    const response = await ClientApi.get(route.params.uid as string);
    formData.value = response.detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'detail');
  }
};

onMounted(load);
</script>