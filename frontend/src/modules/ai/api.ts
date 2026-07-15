import api from "@/api";
import type { ApiResponse } from "@/api/type";
import type { AiFile, Message, PendingAction, Scope, Source, Thread, TurnResult } from "@/modules/ai/type";

const endpoint = '/ai';

export const getFiles = async (query: { scope?: Scope; source?: Source } = {}) => {
  try {
    const params = new URLSearchParams();
    if (query.scope) params.set('scope', query.scope);
    if (query.source) params.set('source', query.source);
    const response = await api.get<ApiResponse<AiFile[]>>(`${endpoint}/files?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const uploadFile = async (file: File, scope: Scope, source?: Source) => {
  try {
    const params = new URLSearchParams({ scope });
    if (source) params.set('source', source);
    const form = new FormData();
    form.append('file', file);
    const response = await api.post<ApiResponse<AiFile>>(`${endpoint}/files?${params.toString()}`, form);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const deleteFile = async (uid: AiFile["uid"]) => {
  try {
    const response = await api.delete<ApiResponse<undefined>>(`${endpoint}/files`, { data: { uid } });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getThreads = async () => {
  try {
    const response = await api.get<ApiResponse<Thread[]>>(`${endpoint}/threads`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const createThread = async (title?: string) => {
  try {
    const response = await api.post<ApiResponse<Thread>>(`${endpoint}/threads`, { title });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const deleteThread = async (uid: Thread["uid"]) => {
  try {
    const response = await api.delete<ApiResponse<undefined>>(`${endpoint}/threads/${uid}`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const getMessages = async (uid: Thread["uid"]) => {
  try {
    const response = await api.get<ApiResponse<{ messages: Message[]; pendingActions: PendingAction[] }>>(`${endpoint}/threads/${uid}/messages`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const sendMessage = async (uid: Thread["uid"], content: string) => {
  try {
    const response = await api.post<ApiResponse<TurnResult>>(`${endpoint}/threads/${uid}/messages`, { content });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const confirmAction = async (uid: PendingAction["uid"]) => {
  try {
    const response = await api.post<ApiResponse<TurnResult>>(`${endpoint}/actions/${uid}/confirm`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export const rejectAction = async (uid: PendingAction["uid"]) => {
  try {
    const response = await api.post<ApiResponse<TurnResult>>(`${endpoint}/actions/${uid}/reject`);
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
}

export default {
  getFiles, uploadFile, deleteFile,
  getThreads, createThread, deleteThread,
  getMessages, sendMessage,
  confirmAction, rejectAction
}
