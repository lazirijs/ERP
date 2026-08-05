<template>
  <detail-app ref="detailAppRef" :config="detailConfig" @edit="editDialogRef?.open()">    
    <template #tab-transactions>
      <transaction-list-app :view="{ type: 'project', data: detailAppRef?.formData }" @updated="detailAppRef?.load()" />
    </template>
    <template #tab-sales>
      <sales-list-app :view="{ type: 'project', data: detailAppRef?.formData }" @updated="detailAppRef?.load()" />
    </template>
    <template #tab-documents>
      <documents-tab :uid="detailAppRef?.formData?.uid" />
    </template>
    <template #edit-dialog>
      <edit-dialog-app ref="editDialogRef" :uid="detailAppRef?.formData?.uid" @submitted="detailAppRef?.load()" />
    </template>
  </detail-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { t } from '@/translate';
import DetailApp from '@/layouts/shared/detail.vue';

import ProjectApi from '@/modules/projects/api';
import { status } from '@/modules/projects/constant';
import type { Project } from '@/modules/projects/type';
import EditDialogApp from '@/modules/projects/components/dialogs/edit.vue';

import SalesListApp from '@/modules/sales/view/list.vue';
import DocumentsTab from '@/modules/projects/components/documents-tab.vue';
import TransactionListApp from '@/modules/transactions/view/list.vue';

import formatter from '@/services/formatter';

const detailAppRef = ref<InstanceType<typeof DetailApp>>();
const editDialogRef = ref<InstanceType<typeof EditDialogApp>>();

const detailConfig = ref<InstanceType<typeof DetailApp>["$props"]["config"]>({
  load: ProjectApi.get,
  sideBar: (data: Project) => [
    { label: t('status'), badge: status[data.status] },
    { label: t('name'), value: data.name },
    { label: t('client'), value: data.client?.name },
    { label: t('offer'), value: formatter.currency(data.offer) },
    { label: t('totalAmountReceived'), value: formatter.currency(data.total_amount_received) },
    { label: t('totalAmountExpensed'), value: formatter.currency(data.total_amount_expensed) },
    { label: t('totalAmountSold'), value: formatter.currency(data.total_amount_sold) },
    { label: t('note'), value: data.note },
    { label: t('createdAt'), value: formatter.date(data.created_at) },
  ],
  tabs: [
    { name: 'transactions', permission: 'transactions.access' },
    { name: 'sales', permission: 'sales.access' },
    { name: 'documents' },
  ],
  editPermission: 'projects.update',
});
</script>