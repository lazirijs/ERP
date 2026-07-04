<template>
  <el-dialog v-model="dialogModel" :title="$t('createTransaction')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <!-- <el-scrollbar> -->
      <el-form ref="formRef" v-loading="loadingContainer.length" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full grid gap-4">
        
        <el-form-item :label="$t('amount')" prop="amount" class="mb-0!">
          <el-input-number v-model="formData.amount" :min="0" :precision="0" :controls="false" :parser="$formatter.number" :formatter="(amount: number) => $formatter.currency(amount, false)" class="w-full!">          
            <template #suffix>
              <span>{{ currency }}</span>
            </template>
          </el-input-number>
        </el-form-item>

        <el-form-item :label="$t('project')" prop="project_uid" class="mb-0!">
          <el-select v-model="formData.project_uid" clearable filterable :placeholder="$t('project')">
            <el-option v-for="project in projects" :key="project.uid" :label="project.name" :value="project.uid" />
          </el-select>
        </el-form-item>

        <!-- <el-form-item :label="$t('type')" prop="type" class="mb-0!">
          <el-select v-model="formData.type" @change="handleTypeChange" filterable :placeholder="$t('type')">
            <el-option v-for="({ label, id }) in type" :key="id" :label="$t(label)" :value="id" />
          </el-select>
        </el-form-item> -->
        
        <template v-if="formData.type == '-'">
          <el-form-item :label="$t('account')" prop="account_uid" class="mb-0!">
            <el-select v-model="formData.account_uid" clearable filterable :placeholder="$t('account')">
              <el-option v-for="account in accounts" :key="account.uid" :label="account.name" :value="account.uid" />
            </el-select>
          </el-form-item>

          <!-- <el-form-item :label="$t('employee')" prop="employee_uid" class="mb-0!">
            <el-select v-model="formData.employee_uid" clearable filterable :placeholder="$t('employee')">
              <el-option v-for="employee in employees" :key="employee.uid" :label="employee.name" :value="employee.uid" />
            </el-select>
          </el-form-item> -->
        </template>

        <el-form-item :label="$t('note')" prop="note" class="mb-0!">
          <el-input v-model="formData.note" :placeholder="$t('note')" />
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
    <!-- </el-scrollbar> -->
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import type { TransactionCreateBody } from '@/modules/transactions/type';
import { useI18n } from 'vue-i18n';
import TransactionApi from '@/modules/transactions/api';
// import { type } from '@/modules/transactions/constant';
import ProjectApi from '@/modules/projects/api';
import AccountApi from '@/modules/accounts/api';
// import EmployeeApi from '@/modules/employees/api';
import type { Project } from '@/modules/projects/type';
import type { Account } from '@/modules/accounts/type';
import { currency } from '@/constants';
// import type { Employee } from '@/modules/employees/type';
import confirmDialog from '@/services/dialog/confirm';

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<( 'projects' | 'accounts' | 'employees' | 'loading' | 'submit' )[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const formRules = reactive<Record<keyof TransactionCreateBody, FormItemRule | FormItemRule[]>>({
  project_uid: { type: 'string', message: t('selectProject'), trigger: 'submit' },
  account_uid: { type: 'string', message: t('selectAccount'), trigger: 'submit' },
  employee_uid: { type: 'string', message: t('selectEmployee'), trigger: 'submit' },
  type: { type: 'string', message: t('selectType'), trigger: 'submit' },
  amount: { required: true, type: 'number', min: 1, message: t('required'), trigger: 'submit' },
  note: { min: 3, max: 50, message: t('lengthShouldBe3To50'), trigger: 'submit' },
});

const formData = ref<TransactionCreateBody>({
  project_uid: '',
  account_uid: '',
  employee_uid: '',
  type: '-',
  amount: 0,
  note: ''
});

const projects = ref<Project[]>([]);
const accounts = ref<Account[]>([]);
// const employees = ref<Employee[]>([]);

// const handleTypeChange = (type: TransactionCreateBody['type']) => {
//   if (type == '+') { 
//     formData.value.account_uid = '';
//     formData.value.employee_uid = '';
//   }
// };

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
    const res = await Promise.all([
      ProjectApi.getAll(),
      AccountApi.getAll(),
      // EmployeeApi.getAll()
    ]);
    projects.value = res[0].detail.data;
    accounts.value = res[1].detail.data;
    // employees.value = res[2].detail.data;
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