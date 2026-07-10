<template>
  <el-dialog v-model="dialogModel" :title="$t('createTransaction')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <el-form ref="formRef" v-loading="loadingContainer.length" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">      
      <el-form-item :label="$t('type')" prop="type" class="mb-0!">
        <el-select v-model="formData.type" :disabled="!!props.account || !!props.purchase || !!props.employee" @change="handleTypeChange" :placeholder="$t('type')" class="w-full el-select-on-focus-no-outline">
          <template #label="{ label, value }">
            <span :class="`badge-app-${transactionsCons.type[value as '-' | '+'].color} p-1!`">
              {{ $t(label) }}
            </span>
          </template>
          <el-option v-for="({ id, label, color }) in transactionsCons.type" :key="id" :label="$t(label)" :value="id">
            <span :class="`badge-app-${color}`">
              {{ $t(label) }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('amount')" prop="amount" class="mb-0!">
        <el-input-number v-model="formData.amount" :min="0" :controls="false" :parser="$formatter.number" :formatter="(amount: number) => $formatter.currency(amount, false)" class="w-full!">          
          <template #suffix>
            <span>{{ currency }}</span>
          </template>
        </el-input-number>
      </el-form-item>

      <el-form-item v-if="!formData.purchase_uid" :label="$t('project')" prop="project_uid" class="mb-0!">
        <el-select v-model="formData.project_uid" @change="onProjectChange" :disabled="!!props.project || !!formData.sale_uid" clearable filterable :placeholder="$t('project')">
          <el-option v-for="project in projects" :key="project.uid" :label="project.name" :value="project.uid" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="!formData.purchase_uid && !props.project" :label="$t('sale')" class="mb-0!">
        <el-select v-model="formData.sale_uid" @change="onSaleChange" :disabled="!!props.sale" clearable filterable :placeholder="$t('sale')">
          <el-option v-for="sale in sales" :key="sale.uid" :label="sale.name" :value="sale.uid" />
        </el-select>
      </el-form-item>
  
      <template v-if="formData.type === '-'">
        <el-form-item v-if="!formData.project_uid && !formData.sale_uid" :label="$t('purchase')" prop="purchase_uid" class="mb-0!">
          <el-select v-model="formData.purchase_uid" @change="onPurchaseChange" :disabled="!!props.purchase" clearable filterable :placeholder="$t('purchase')">
            <el-option v-for="purchase in purchases" :key="purchase.uid" :label="purchase.name" :value="purchase.uid" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('account')" prop="account_uid" class="mb-0!">
          <el-select v-model="formData.account_uid" :disabled="!!props.account" clearable filterable :placeholder="$t('account')">
            <el-option v-for="account in accounts" :key="account.uid" :label="account.name" :value="account.uid" />
          </el-select>
        </el-form-item>
  
        <el-form-item :label="$t('employee')" prop="employee_uid" class="mb-0!">
          <el-select v-model="formData.employee_uid" :disabled="!!props.employee" clearable filterable :placeholder="$t('employee')">
            <el-option v-for="employee in employees" :key="employee.uid" :label="employee.name" :value="employee.uid" />
          </el-select>
        </el-form-item>
      </template>

      <el-form-item :label="$t('note')" prop="note" class="mb-0!">
        <el-input v-model="formData.note" type="textarea" :placeholder="$t('note')" />
      </el-form-item>
    </el-form>
    <div class="flex justify-end gap-2 mb-0! mt-8">
      <el-button @click="close()">
        {{ $t("close") }}
      </el-button>
      <el-button type="primary" @click="submit()">
        {{ $t("create") }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import type { TransactionCreateBody } from '@/modules/transactions/type';
import { useI18n } from 'vue-i18n';
import TransactionApi from '@/modules/transactions/api';
import ProjectApi from '@/modules/projects/api';
import AccountApi from '@/modules/accounts/api';
import EmployeeApi from '@/modules/employees/api';
import SaleApi from '@/modules/sales/api';
import PurchaseApi from '@/modules/purchases/api';
import type { Project } from '@/modules/projects/type';
import type { Account } from '@/modules/accounts/type';
import { currency } from '@/constants';
import type { Employee } from '@/modules/employees/type';
import type { Sale } from '@/modules/sales/type';
import confirmDialog from '@/services/dialog/confirm';
import transactionsCons from '../../constant';
import type { Purchase } from '@/modules/purchases/type';

const emit = defineEmits(['submitted']);

const props = defineProps<{
  defaultType?: TransactionCreateBody["type"];
  sale?: Sale;
  project?: Project;
  employee?: Employee;
  account?: Account;
  purchase?: Purchase;
}>();

const { t } = useI18n();

const loadingContainer = ref<( 'projects' | 'accounts' | 'employees' | 'loading' | 'submit' )[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof TransactionCreateBody, FormItemRule | FormItemRule[]>>({
  project_uid: { type: 'string', message: t('selectProject'), trigger: 'submit' },
  account_uid: { type: 'string', message: t('selectAccount'), trigger: 'submit' },
  purchase_uid: { type: 'string', message: t('selectPurchase'), trigger: 'submit' },
  employee_uid: { type: 'string', message: t('selectEmployee'), trigger: 'submit' },
  sale_uid: { type: 'string', message: t('selectSale'), trigger: 'submit' },
  type: { type: 'string', message: t('selectType'), trigger: 'submit' },
  amount: { required: true, type: 'number', min: 1, message: t('required'), trigger: 'submit' },
  note: { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
});

const formData = ref<TransactionCreateBody>({
  project_uid: '',
  account_uid: '',
  employee_uid: '',
  sale_uid: '',
  purchase_uid: '',
  type: '-',
  amount: 0,
  note: ''
});

const projects = ref<Project[]>([]);
const accounts = ref<Account[]>([]);
const employees = ref<Employee[]>([]);
const sales = ref<Sale[]>([]);
const purchases = ref<Purchase[]>([]);

// Selecting a sale auto-fills (and locks) the project to that sale's project
const onSaleChange = (uid: string) => {
  if (!uid) return;
  const sale = sales.value.find(s => s.uid === uid);
  formData.value.project_uid = sale?.project?.uid ?? sale?.project_uid ?? '';
  formData.value.purchase_uid = '';
};

// Selecting a purchase auto-fills (and locks) the project to that purchase's project
const onPurchaseChange = (uid: string) => {
  if (!uid) return;
  formData.value.sale_uid = '';
  formData.value.project_uid = '';
};

// Selecting a project auto-fills (and locks) the project to that project's project
const onProjectChange = (uid: string) => {
  if (!uid) return;
  formData.value.purchase_uid = '';
};

const handleTypeChange = (type: TransactionCreateBody['type']) => {
  if (type == '+') {
    formData.value.account_uid = '';
    formData.value.employee_uid = '';
    formData.value.purchase_uid = '';
  } else {
    formData.value.sale_uid = '';
  }
};

const reset = (formEl: FormInstance | undefined = formRef.value) => {
  if (!formEl) return;
  formEl.resetFields();
};

const close = (formEl: FormInstance | undefined = formRef.value, triggerSubmitted: boolean = false) => {
  reset(formEl);
  if (triggerSubmitted) emit('submitted');
  dialogModel.value = false;
};

const submit = async (formEl: FormInstance | undefined = formRef.value) => {
  if (!formEl) return;
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      await confirmDialog({
        message: 'areYouSureYouWantToCreateThisTransaction?',
        title: 'createTransaction',
        confirmButtonText: 'create',
        confirmButtonType: 'primary',
        cancelButtonText: 'cancel',
        type: 'info',
      })
      try {
        loadingContainer.value.push('submit');
        await TransactionApi.create(formData.value);
        ElMessage.success(t('transactionCreatedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToCreateTransaction');
        ElMessage.error(errorMessage);
      } finally {
        loadingContainer.value = loadingContainer.value.filter(item => item !== 'submit');
      }
    } else {
      const firstError = Object.values(fields!)[0][0];
      ElMessage.error(`${t(firstError.field!)}: ${firstError.message}`);
    }
  })
};

const open = async () => {
  dialogModel.value = true;
  try {
    loadingContainer.value.push('loading');
    if (props.defaultType) formData.value.type = props.defaultType;
    if (props.sale) {
      formData.value.sale_uid = props.sale.uid;
      formData.value.project_uid = props.sale.project_uid!;
      if (props.sale.total_amount - props.sale.total_amount_received > 0) formData.value.amount = props.sale.total_amount - props.sale.total_amount_received;
      projects.value = [props.sale.project as Project];
      sales.value = [props.sale as Sale];
    } 
    else {
      if (props.project) {
        formData.value.project_uid = props.project.uid;
        projects.value = [props.project];
      }
      else if (props.purchase) {
        formData.value.type = "-";
        formData.value.purchase_uid = props.purchase.uid;
        formData.value.amount = props.purchase.total_amount;
        if (props.purchase.total_amount - props.purchase.total_amount_expensed > 0) formData.value.amount = props.purchase.total_amount - props.purchase.total_amount_expensed;
        purchases.value = [props.purchase as Purchase];
      }
      else if (props.employee) {
        formData.value.type = "-";
        formData.value.employee_uid = props.employee.uid;
        employees.value = [props.employee];
      }
      if (props.account) {
        formData.value.type = "-";
        formData.value.account_uid = props.account.uid;
        accounts.value = [props.account];
      }
      const reqs: (() => Promise<any>)[] = [];
      if (!sales.value.length && !props.project && !props.employee && !props.account) reqs[0] = SaleApi.getAll;
      if (!projects.value.length) reqs[1] = ProjectApi.getAll;
      if (!employees.value.length) reqs[2] = EmployeeApi.getAll;
      if (!accounts.value.length) reqs[3] = AccountApi.getAll;
      if (!purchases.value.length) reqs[4] = PurchaseApi.getAll;
      const res = await Promise.all(reqs.map(fn => fn()));
      if (reqs[0]) sales.value = res[0].detail.data;
      if (reqs[1]) projects.value = res[1].detail.data;
      if (reqs[2]) employees.value = res[2].detail.data;
      if (reqs[3]) accounts.value = res[3].detail.data;
      if (reqs[4]) purchases.value = res[4].detail.data;
    }
  } catch (error: any) {
    const errorMessage = error?.detail?.message || t('loadingFailed');
    ElMessage.error(errorMessage);
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({
  open
  // close: () => close()
});
</script>