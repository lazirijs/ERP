<template>
    <header class="w-full h-16! bg-white border-b border-gray-300 flex justify-between items-center gap-4 px-4 shrink-0">        
        <div class="min-w-auto truncate flex items-center gap-4">
            <el-icon v-if="$authStore().isAuthed && $appStore().isMobile" @click="toggleCollapse()" :size="14">
                <el-icon-arrow-right-bold class="text-gray-500" />
            </el-icon>
            <span class="text-lg font-semibold truncate">{{ $t($route.name as string || 'loading') }}</span>
            <!-- <p class="text-sm text-gray-500">Parents > Childrens</p> -->
        </div>

        <div class="flex items-center gap-4">
            
            <el-button-group v-if="$route.meta.auth == 'required'" direction="horizontal" class="min-w-fit">
                <el-button @click="chatbotDialogRef?.open()" text>
                    <el-icon>
                        <el-icon-service />
                    </el-icon>
                    <small class="absolute -top-1.5 right-1 bg-yellow-500 text-white px-1 rounded mr-0.5">BETA</small>
                </el-button>
                <!-- <el-button>
                    <el-icon>
                        <el-icon-bell />
                    </el-icon>
                </el-button> -->
            </el-button-group>


            <el-dropdown>
                <el-button type="info" link class="outline-none!" :class="{ 'uppercase': $appStore().isMobile }">
                    {{ $appStore().isMobile ? languages[$i18n.locale as LanguagesCode]?.code : languages[$i18n.locale as LanguagesCode]?.label }}
                    <el-icon class="el-icon--right">
                        <el-icon-arrow-down />
                    </el-icon>
                </el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item v-for="lang in languages" :key="lang.code" @click="$appStore().setLanguage(lang.code)">
                            {{ lang.label }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>

            <el-dropdown v-if="$route.meta.auth == 'required'" size="large" placement="bottom-end">
                <el-avatar :src="$previewImage({ type: 'avatar' })" class="bg-gray-100 border border-gray-200" />
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="profileDialogRef?.open()">
                            <div class="flex items-center gap-2">
                                <el-icon>
                                    <el-icon-user />
                                </el-icon>
                                <span>{{ $t('profile') }}</span>
                            </div>
                        </el-dropdown-item>
                        <el-dropdown-item>
                            <div class="flex items-center gap-2">
                                <el-icon>
                                    <el-icon-setting />
                                </el-icon>
                                <span>{{ $t('settings') }}</span>
                            </div>
                        </el-dropdown-item>
                        <el-dropdown-item divided @click="logout()" class="text-red-500! hover:bg-red-50! hover:text-red-600!">
                            <div class="flex items-center gap-2">
                                <el-icon>
                                    <el-icon-lock />
                                </el-icon>
                                <span>{{ $t('logout') }}</span>
                            </div>
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>

            <profile-dialog-app ref="profileDialogRef" />
            <chatbot-dialog-app v-if="$authStore().isAuthed" ref="chatbotDialogRef" />
        </div>
        
    </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { languages } from '@/translate/constants';
import type { LanguagesCode } from '@/translate/type';
import AuthStore from '@/modules/auth/store';
import AuthApi from '@/modules/auth/api';
import { ElLoading, ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import ProfileDialogApp from '@/layouts/header/components/dialogs/profile.vue';
import ChatbotDialogApp from '@/modules/ai/components/dialogs/chatbot.vue';
import confirmDialog from '@/services/dialog/confirm';

const { t } = useI18n();

const props = defineProps<{
  isCollapsed: boolean;
}>();

const emit = defineEmits<{
  'toggle-collapse': [isCollapsed: boolean];
}>();

const authStore = AuthStore();
const authApi = new AuthApi();

const profileDialogRef = ref<InstanceType<typeof ProfileDialogApp>>();
const chatbotDialogRef = ref<InstanceType<typeof ChatbotDialogApp>>();

const toggleCollapse = () => {
  emit('toggle-collapse', !props.isCollapsed);
};

const logout = async () => {
    let loading: any;
    
    await confirmDialog({
        message: 'areYouSureYouWantToLogout?',
        title: 'logout',
        confirmButtonText: 'logout',
        confirmButtonType: 'danger',
        cancelButtonText: 'cancel',
        type: 'warning'
    });
    
    try {
        loading = ElLoading.service();
        await authApi.logout();
        authStore.logout();
        ElMessage.success(t('logoutSuccessful'));
    } catch (error) { 
        ElMessage.error(t('logoutFailed'));
    } finally {     
        loading?.close();
    }
}
</script>