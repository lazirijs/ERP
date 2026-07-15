import { computed, ref } from "vue";
import { defineStore } from "pinia";
import AiApi from "@/modules/ai/api";
import type { AiFile, Message, PendingAction, Scope, Source, Thread } from "@/modules/ai/type";

export default defineStore("ai", () => {
  const threads = ref<Thread[]>([]);
  const activeThreadUid = ref<string | null>(null);
  const sendingThreadUid = ref<string | null>(null);
  const messages = ref<Message[]>([]);
  const pendingActions = ref<PendingAction[]>([]);

  const files = ref<AiFile[]>([]);

  const sending = computed(() => activeThreadUid.value && sendingThreadUid.value === activeThreadUid.value);
  
  const loadingTheads = ref(false);
  const loadingMessages = ref(false);
  const loadingFiles = ref(false);
  const resolvingAction = ref<string | null>(null);

  /** `tool` messages are model plumbing -- the transcript only shows the conversation. */
  const visibleMessages = computed(() => messages.value.filter(message => message.role !== 'tool'));

  /** Only one write can await confirmation at a time -- the loop stops on the first one. */
  const openAction = computed(() => pendingActions.value.find(action => action.status === 'pending') ?? null);

  const isIngesting = computed(() =>
    files.value.some(file => file.status === 'pending' || file.status === 'processing')
  );

  const loadThreads = async () => {
    loadingTheads.value = true;
    try {
      const response = await AiApi.getThreads();
      if (response.success) threads.value = response.detail;
    } finally {
      loadingTheads.value = false;
    }
  };

  const newChat = () => {
    // The thread row is created on first send, so abandoning a new chat
    // doesn't leave an empty thread in the history list.
    activeThreadUid.value = "new-chat";
    messages.value = [];
    pendingActions.value = [];
  };

  const selectThread = async (uid: string) => {
    activeThreadUid.value = uid;
    loadingMessages.value = true;
    try {
      const response = await AiApi.getMessages(uid);
      if (response.success) {
        messages.value = response.detail.messages;
        pendingActions.value = response.detail.pendingActions;
      }
    } finally {
      loadingMessages.value = false;
    }
  };

  const removeThread = async (uid: string) => {
    await AiApi.deleteThread(uid);
    threads.value = threads.value.filter(thread => thread.uid !== uid);
    if (activeThreadUid.value === uid) newChat();
  };

  const send = async (content: string) => {
    sendingThreadUid.value = activeThreadUid.value;
    try {
      if (activeThreadUid.value === "new-chat") {
        const created = await AiApi.createThread();
        if (!created.success) throw created;
        activeThreadUid.value = created.detail.uid;
        threads.value.unshift(created.detail);
      }

      // Show the user's message immediately; the turn can take several seconds.
      messages.value.push({
        uid: `local-${Date.now()}`,
        thread_uid: activeThreadUid.value!,
        role: 'user',
        content,
        citations: '',
        created_at: new Date().toISOString()
      });

      const response = await AiApi.sendMessage(activeThreadUid.value!, content);
      if (!response.success) throw response;

      messages.value.push(...response.detail.messages);
      if (response.detail.pendingAction) pendingActions.value.push(response.detail.pendingAction);

      await loadThreads();
    } finally {
      sendingThreadUid.value = null;
    }
  };

  const resolveAction = async (uid: string, approve: boolean) => {
    resolvingAction.value = uid;
    try {
      const response = approve ? await AiApi.confirmAction(uid) : await AiApi.rejectAction(uid);
      if (!response.success) throw response;

      const action = pendingActions.value.find(item => item.uid === uid);
      if (action) action.status = approve ? 'executed' : 'rejected';

      messages.value.push(...response.detail.messages);
      if (response.detail.pendingAction) pendingActions.value.push(response.detail.pendingAction);
    } finally {
      resolvingAction.value = null;
    }
  };

  const loadFiles = async (query: { scope?: Scope; source?: Source } = {}) => {
    loadingFiles.value = true;
    try {
      const response = await AiApi.getFiles(query);
      if (response.success) files.value = response.detail;
    } finally {
      loadingFiles.value = false;
    }
  };

  const upload = async (file: File, scope: Scope, source?: Source) => {
    const response = await AiApi.uploadFile(file, scope, source);
    if (response.success) files.value.unshift(response.detail);
    return response;
  };

  const removeFile = async (uid: string) => {
    await AiApi.deleteFile(uid);
    files.value = files.value.filter(file => file.uid !== uid);
  };

  return {
    threads, activeThreadUid, messages, pendingActions, files,
    sendingThreadUid, sending, loadingMessages, loadingFiles, resolvingAction,
    visibleMessages, openAction, loadingTheads, isIngesting,
    loadThreads, newChat, selectThread, removeThread,
    send, resolveAction,
    loadFiles, upload, removeFile
  };
});
