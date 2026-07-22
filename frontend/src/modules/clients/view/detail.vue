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
            <el-button :disabled="!$hasPermission('clients.update')" @click="editDialogRef?.open()" text class="m-0!">
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
        <el-tabs type="border-card" :default-value="activeTab" @tab-change="$router.replace({ query: { tab: $event } })">
          <el-tab-pane :label="$t('projects')" name="projects" :disabled="!$hasPermission('projects.access')">
            <projects-list-app v-if="activeTab === 'projects'" :view="{ type: 'client', data: formData }" @updated="load()" />
          </el-tab-pane>
          <el-tab-pane :label="$t('sales')" name="sales" :disabled="!$hasPermission('sales.access')">
            <sales-list-app v-if="activeTab === 'sales'" :view="{ type: 'client', data: formData }" @updated="load()" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <edit-dialog-app ref="editDialogRef" :client_uid="formData.uid" @submitted="load()" />
  </container-app>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import ClientApi from '@/modules/clients/api';
import type { Client } from '@/modules/clients/type';
import SalesListApp from '@/modules/sales/view/list.vue';
import EditDialogApp from '@/modules/clients/components/dialogs/edit.vue';
import ProjectsListApp from '@/modules/projects/view/list.vue';
import AuthStore from '@/modules/auth/store';

const route = useRoute();
const authStore = AuthStore();

// Land on the first tab the user can actually open, so a gated default tab never leaves them
// staring at a disabled, empty pane.
const defaultTab = computed(() => {
  const tabs: { name: string; permission?: string }[] = [
    { name: 'projects', permission: 'projects.access' },
    { name: 'sales', permission: 'sales.access' },
  ];
  return (tabs.find(t => !t.permission || authStore.hasPermission(t.permission)) ?? tabs[0]).name;
});
const activeTab = computed(() => (route.query.tab as string) || defaultTab.value);

const loadingContainer = ref<('detail')[]>([]);

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