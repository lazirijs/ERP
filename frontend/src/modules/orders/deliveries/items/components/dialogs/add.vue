<template>
  <el-dialog v-model="dialogModel" :title="$t('addItem')" align-center class="min-w-11/12 md:min-w-1/4! md:max-w-1/4!" @closed="reset()" :before-close="(done: any) => !loadingContainer.includes('submit') && done()">
    <el-form ref="formRef" v-loading="loadingContainer.includes('submit')" :model="formData" :rules="formRules" @submit.prevent="submit()" label-position="top" class="w-full">
      <el-form-item :label="$t('item')" prop="item_uid">
        <el-select v-model="formData.item_uid" filterable :placeholder="$t('item')">
          <el-option v-for="item in items" :key="item.uid" :label="item.name" :value="item.uid" />
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('unitPrice')" prop="unit_price">
        <el-input v-model="formData.unit_price" :parser="$formatter.number" :formatter="$formatter.currency" :placeholder="$t('unitPrice')" />
      </el-form-item>

      <el-form-item :label="$t('quantity')" prop="quantity">
        <el-input v-model.number="formData.quantity" type="number" :placeholder="$t('quantity')" :min="1" :disabled="!getSelectedItem" :max="getSelectedItem ? (getSelectedItem.requested_quantity - getSelectedItem.delivered_quantity) : 0">
          <template v-if="getSelectedItem" #append>
            <span>{{ getSelectedItem.requested_quantity - getSelectedItem.delivered_quantity }}</span>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item :label="$t('note')" prop="note">
        <el-input v-model="formData.note" :placeholder="$t('note')" />
      </el-form-item>

      <el-form-item class="mb-0! mt-8">
        <div class="ml-auto">
          <el-button @click="close()">
            {{ $t("close") }}
          </el-button>
          <el-button type="primary" @click="submit()">
            {{ $t("add") }}
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus'
import type { DeliveryItemCreateBody } from '../../type';
import type { Item } from '@/modules/orders/items/type';
import deliveriesItemsApi from '../../api';
import itemsApi from '@/modules/orders/items/api';

const props = defineProps<{
  order_uid: string;
  delivery_uid: string;
}>();

const emit = defineEmits(['submitted']);

const { t } = useI18n();

const loadingContainer = ref<('submit' | 'loading')[]>([]);

const formRef = ref<FormInstance>();
const dialogModel = ref<boolean>(false);

const items = ref<Item[]>([]);

const formRules = reactive<Record<keyof DeliveryItemCreateBody, FormItemRule | FormItemRule[]>>({
  item_uid: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  delivery_uid: [
    { required: true, message: t('required'), trigger: 'submit' },
  ],
  quantity: [
    { required: true, type: 'number', message: t('required'), trigger: 'submit' },
  ],
  unit_price: [
    { required: true, type: 'number', message: t('required'), trigger: 'submit' },
  ],
  note: [
    { max: 250, message: t('MaxLengthIs250'), trigger: 'submit' },
  ]
});

const formData = ref<DeliveryItemCreateBody>({
  delivery_uid: props.delivery_uid,
  item_uid: '',
  quantity: 0,
  unit_price: 0
});

const getSelectedItem = computed(() => {
  return items.value.find(item => item.uid === formData.value.item_uid);
});

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
      await ElMessageBox.confirm(
        t('areYouSureYouWantToAddThisItem?'),
        t('addItem'),
        {
          confirmButtonText: t('add'),
          confirmButtonType: 'primary',
          cancelButtonText: t('cancel'),
          type: 'info',
        }
      )
      try {
        loadingContainer.value.push('submit');
        await deliveriesItemsApi.create(formData.value);
        ElMessage.success(t('itemAddedSuccessfully'));
        close(formEl, true);
      } catch (error: any) {
        const errorMessage = error?.detail?.message || t('failedToAddItem');
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
    const response = await itemsApi.getAll({ order_uid: props.order_uid, getUnusedOnDeliveryUid: props.delivery_uid });
    formData.value.delivery_uid = props.delivery_uid;
    items.value = response.detail.data;
  } catch (error: any) {
    const errorMessage = error?.detail?.message || t('loadingFailed');
    ElMessage.error(errorMessage);
    dialogModel.value = false;
  } finally {
    loadingContainer.value = loadingContainer.value.filter(item => item !== 'loading');
  }
};

defineExpose({
  open,
  // close: () => close()
});
</script>