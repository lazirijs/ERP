<template>
    <el-dialog v-model="dialogModel" :title="$t('assistant')" align-center body-class="p-0!"
        :class="{ 'min-w-11/12 md:min-w-4/5! md:max-w-4/5!': !fullScreen }" :fullscreen="fullScreen" @opened="onOpened">

        <template #header="">
            <div class="flex justify-between items-center gap-2 relative w-full">
                <span>
                    {{ $t('assistant') }}
                    <small class="text-xs bg-yellow-500 text-white px-1 mx-2 rounded">BETA</small>
                </span>            
                
                <el-button link @click="fullScreen = !fullScreen">
                    <el-icon class="absolute -top-1.5">
                        <el-icon-full-screen :class="{ 'text-blue-400': fullScreen === true }" />
                    </el-icon>
                </el-button>
            </div>
        </template>

        <div class="flex md:hidden gap-2">
            <el-button @click="startNewChat" class="w-1/6">
                <el-icon>
                    <el-icon-plus />
                </el-icon>
            </el-button>
            <el-button-group direction="horizontal" class="w-full mb-4">
                <el-button @click="view = 'chat'" :type="view === 'chat' && 'primary'" class="w-1/3">{{ $t("chat") }}</el-button>
                <el-button @click="view = 'files'" :type="view === 'files' && 'primary'" class="w-1/3">{{ $t("files") }}</el-button>
                <el-button @click="view = 'history'" :type="view === 'history' && 'primary'" class="w-1/3">{{ $t("history") }}</el-button>
            </el-button-group>
        </div>

        <div class="flex border-t border-gray-200" :class="{ 'h-[70vh]': !fullScreen,'h-[90vh]': fullScreen }">

            <!-- Sidebar -->
            <aside class="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200">
                <div class="py-3 pr-3 space-y-2">
                    <el-button type="primary" plain class="w-full" @click="startNewChat">
                        <el-icon class="mr-1"><el-icon-plus /></el-icon>
                        {{ $t('newChat') }}
                    </el-button>
                    <el-button @click="openFiles" type="primary" :plain="view != 'files'" class="w-full mx-0!">
                        <el-icon class="mr-1"><el-icon-folder /></el-icon>
                        {{ $t('files') }}
                    </el-button>
                </div>

                <div class="pb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    {{ $t('history') }}
                </div>
                <el-scrollbar v-loading="store.loadingTheads">
                    <div class="flex-1 overflow-y-auto pr-2 pb-2 space-y-1">
                        <div v-for="thread in store.threads" :key="thread.uid" @click="openThread(thread.uid)"
                            class="group flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm"
                            :class="thread.uid === store.activeThreadUid && view === 'chat' ? 'bg-white font-medium' : 'hover:bg-gray-100 text-gray-600'">
                            <span class="truncate flex-1">{{ thread.title || $t('newChat') }}</span>
                            <el-icon
                                @click.stop="removeThread(thread.uid)">
                                <el-icon-delete class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-300" />
                            </el-icon>
                        </div>
                        <p v-if="!store.threads.length" class="px-2 py-4 text-xs text-gray-400 text-center">
                            {{ $t('noMessages') }}
                        </p>
                    </div>
                </el-scrollbar>
            </aside>

            <!-- Content -->
            <section class="flex-1 flex flex-col min-w-0">

                <!-- Chat -->
                <template v-if="view === 'chat'">
                    <el-scrollbar ref="scrollbarChatRef" v-loading="store.loadingMessages">
                        <div class="flex-1 overflow-y-auto py-4 md:p-4 space-y-4">
                            <p v-if="!store.visibleMessages.length" class="text-center text-sm text-gray-400 py-10">
                                {{ $t('askAnything') }}
                            </p>
    
                            <div v-for="message in store.visibleMessages" :key="message.uid"
                                class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
                                <div :title="formatter.date(message.created_at)" class="max-w-3/4 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap wrap-break-word"
                                    :class="message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'">
                                    {{ message.content }}
    
                                    <div v-if="citationsOf(message).length" class="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-1">
                                        <span class="text-xs text-gray-500 mr-1">{{ $t('sources') }}:</span>
                                        <el-tag v-for="citation in citationsOf(message)" :key="citation" size="small" type="info">
                                            {{ citation }}
                                        </el-tag>
                                    </div>
                                </div>
                            </div>
    
                            <!-- The write gate: nothing has been saved until this is confirmed -->
                            <template v-if="store.openAction">
                                <div class="flex items-center gap-2 mb-2">
                                    <el-icon class="text-amber-500"><el-icon-warning-filled /></el-icon>
                                    <span class="font-medium text-sm">{{ $t('confirmAction') }}</span>
                                </div>
    
                                <p class="text-xs text-gray-500 mb-2">{{ store.openAction.tool_name }}</p>
    
                                <div class="bg-white rounded border border-gray-200 divide-y divide-gray-100 mb-3">
                                    <div v-for="(value, key) in actionInput" :key="key" class="flex gap-2 px-3 py-1.5 text-sm">
                                        <span class="text-gray-500 min-w-24">{{ key }}</span>
                                        <span class="font-medium break-all">{{ value === null ? '—' : value }}</span>
                                    </div>
                                </div>
    
                                <div class="flex justify-end gap-2">
                                    <el-button @click="store.resolveAction(store.openAction!.uid, false)" size="small" :loading="store.resolvingAction === ('reject-' + store.openAction.uid)" :disabled="store.resolvingAction">
                                        {{ $t('reject') }}
                                    </el-button>
                                    <el-button @click="store.resolveAction(store.openAction!.uid, true)" size="small" type="primary" :loading="store.resolvingAction === ('confirm-' + store.openAction.uid)" :disabled="store.resolvingAction">
                                        {{ $t('confirm') }}
                                    </el-button>
                                </div>
                            </template>
    
                            <div v-if="store.sending" class="flex justify-start">
                                <div class="bg-gray-100 rounded-lg px-3 py-2">
                                    <el-icon class="is-loading text-gray-400"><el-icon-loading /></el-icon>
                                </div>
                            </div>
                        </div>
                    </el-scrollbar>

                    <div class="border-t border-gray-200 pt-3 pl-3 flex gap-2">
                        <el-input v-model="draft" :placeholder="$t('askAnything')" :disabled="store.sending"
                            @keyup.enter="submit" />
                        <el-button type="primary" :loading="store.sending" :disabled="!draft.trim()" @click="submit">
                            {{ $t('send') }}
                        </el-button>
                    </div>
                </template>

                <!-- Files -->
                <template v-else-if="view === 'files'">
                    <el-tabs v-model="activeTab" class="md:pl-4 pt-2" @tab-change="loadTab">
                        <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="$t(tab.label)" :name="tab.name" />
                    </el-tabs>

                    <div class="px-4 pb-2 flex justify-between items-center">
                        <p class="text-xs text-gray-400">
                            {{ currentTab.uploadable ? '' : $t('readOnlyHere') }}
                        </p>
                        <el-upload v-if="currentTab.uploadable" :auto-upload="false" :show-file-list="false"
                            :on-change="onFileSelected">
                            <el-button size="small" type="primary">
                                <el-icon class="mr-1"><component :is="`el-icon-${ uploading ? 'loading' : 'upload-filled' }`" :class="{ 'animate-spin': uploading }" /></el-icon>
                                {{ $t('upload') }}
                            </el-button>
                        </el-upload>
                    </div>

                    <el-scrollbar v-loading="store.loadingFiles">
                        <div class="flex-1 overflow-y-auto px-4 pb-4">
                            <p v-if="!store.files.length" class="text-center text-sm text-gray-400 py-10">
                                {{ $t('noFiles') }}
                            </p>
    
                            <div v-for="file in store.files" :key="file.uid"
                                class="flex items-center gap-3 py-2 border-b border-gray-100 text-sm">
                                <el-icon class="text-gray-400"><el-icon-document /></el-icon>
                                <div class="flex-1 min-w-0">
                                    <p class="truncate">{{ file.file_name }}</p>
                                    <p class="text-xs text-gray-400">{{ formatSize(file.size) }}</p>
                                </div>
    
                                <el-tooltip v-if="file.status === 'failed'" :content="file.error" placement="top">
                                    <el-tag size="small" type="danger">{{ $t('failed') }}</el-tag>
                                </el-tooltip>
                                <el-tag v-else size="small" :type="statusTag[file.status]">
                                    {{ $t(file.status) }}
                                </el-tag>
    
                                <el-icon v-if="file.scope !== 'module'" class="text-gray-400 hover:text-red-500 cursor-pointer"
                                    @click="remove(file)">
                                    <el-icon-delete />
                                </el-icon>
                            </div>
                        </div>
                    </el-scrollbar>
                </template>

                <el-scrollbar v-else-if="view === 'history'" v-loading="store.loadingTheads">
                    <div class="flex-1 overflow-y-auto pr-2 pb-2 space-y-1">
                        <div v-for="thread in store.threads" :key="thread.uid" @click="openThread(thread.uid)"
                            class="group flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm"
                            :class="thread.uid === store.activeThreadUid ? 'bg-white font-medium' : 'hover:bg-gray-100 text-gray-600'">
                            <span class="truncate flex-1">{{ thread.title || $t('newChat') }}</span>
                            <el-icon
                                @click.stop="removeThread(thread.uid)">
                                <el-icon-delete class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-300" />
                            </el-icon>
                        </div>
                        <p v-if="!store.threads.length" class="px-2 py-4 text-xs text-gray-400 text-center">
                            {{ $t('noMessages') }}
                        </p>
                    </div>
                </el-scrollbar>

            </section>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { ElMessage, type ScrollbarInstance, type UploadFile } from 'element-plus';
import { useI18n } from 'vue-i18n';
import AiStore from '@/modules/ai/store';
import type { AiFile, Citation, FilesTab, Message } from '@/modules/ai/type';
import confirmDialog from '@/services/dialog/confirm';
import formatter from '@/services/formatter';

const { t } = useI18n();
const store = AiStore();

const dialogModel = ref(false);
const view = ref<'chat' | 'files' | 'history'>('chat');
const draft = ref<string>('');
const activeTab = ref('all');
const uploading = ref<boolean>(false);
const fullScreen = ref<boolean>(false);
const scrollbarChatRef = ref<ScrollbarInstance>();

// Company and personal are uploadable from here. The per-module tabs surface
// documents that belong to an ERP record, so they are read-only in the assistant.
const tabs: FilesTab[] = [
    { name: 'all', label: 'all', uploadable: false },
    { name: 'company', label: 'company', scope: 'company', uploadable: true },
    { name: 'personal', label: 'personal', scope: 'personal', uploadable: true },
    { name: 'projects', label: 'projects', scope: 'module', source: 'projects', uploadable: false },
    { name: 'products', label: 'products', scope: 'module', source: 'products', uploadable: false },
    { name: 'employees', label: 'employees', scope: 'module', source: 'employees', uploadable: false },
    { name: 'purchases', label: 'purchases', scope: 'module', source: 'purchases', uploadable: false }
];

const statusTag = {
    pending: 'info',
    processing: 'warning',
    ready: 'success',
    failed: 'danger'
} as const;

const currentTab = computed(() => tabs.find(tab => tab.name === activeTab.value)!);

const actionInput = computed(() => {
    if (!store.openAction) return {};
    try {
        return JSON.parse(store.openAction.input) as Record<string, unknown>;
    } catch {
        return {};
    }
});

const citationsOf = (message: Message): string[] => {
    if (!message.citations) return [];
    try {
        // One chip per document, not per matched chunk.
        return [...new Set((JSON.parse(message.citations) as Citation[]).map(citation => citation.file_name))];
    } catch {
        return [];
    }
};

const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const scrollToBottom = async () => {
    await nextTick();
    if (scrollbarChatRef.value) scrollbarChatRef.value.scrollTo({ top: scrollbarChatRef.value.wrapRef!.scrollHeight });
};

const startNewChat = () => {
    store.newChat();
    view.value = 'chat';
};

const openThread = async (uid: string) => {
    view.value = 'chat';
    await store.selectThread(uid);
    scrollToBottom();
};

const loadTab = () => {
    const tab = currentTab.value;
    store.loadFiles({ scope: tab.scope, source: tab.source });
};

const openFiles = () => {
    view.value = 'files';
    loadTab();
};

const submit = async () => {
    const content = draft.value.trim();
    if (!content || store.sending) return;
    draft.value = '';
    scrollToBottom();
    try {
        await store.send(content);
    } catch (error: any) {
        draft.value = content;
        ElMessage.error(error?.detail?.message || t('somethingWentWrong'));
    }
    scrollToBottom();
};

const onFileSelected = async (uploadFile: UploadFile) => {
    if (!uploadFile.raw) return;
    uploading.value = true;
    try {
        await store.upload(uploadFile.raw, currentTab.value.scope!, currentTab.value.source);
        ElMessage.success(t('upload'));
    } catch (error: any) {
        ElMessage.error(error?.detail?.message || t('uploadFailed'));
    } finally {
        uploading.value = false;
    }
};

const remove = async (file: AiFile) => {
    await confirmDialog({
        message: 'areYouSureYouWantToDeleteThisFile?', title: 'delete',
        confirmButtonText: 'delete', confirmButtonType: 'danger', cancelButtonText: 'cancel', type: 'warning'
    });
    try {
        await store.removeFile(file.uid);
    } catch (error: any) {
        ElMessage.error(error?.detail?.message || t('deleteFailed'));
    }
};

const removeThread = async (uid: string) => {
    await confirmDialog({
        message: 'areYouSureYouWantToDeleteThisThread?', title: 'delete',
        confirmButtonText: 'delete', confirmButtonType: 'danger', cancelButtonText: 'cancel', type: 'warning'
    });
    try {
        await store.removeThread(uid);
    } catch (error: any) {
        ElMessage.error(error?.detail?.message || t('deleteFailed'));
    }
};

// Ingestion runs on a queue, so the row lands as `pending` and turns `ready`
// out-of-band. Poll only while something is actually in flight.
let poller: ReturnType<typeof setInterval> | undefined;

watch(() => store.isIngesting && view.value === 'files' && dialogModel.value, (active) => {
    clearInterval(poller);
    if (active) poller = setInterval(loadTab, 3000);
}, { immediate: true });

watch(() => store.visibleMessages.length, scrollToBottom);

onUnmounted(() => clearInterval(poller));

const onOpened = () => {
    store.loadThreads();
    scrollToBottom();
};

defineExpose({
    open: () => {
        dialogModel.value = true;
    }
});
</script>
