export type Scope = 'company' | 'personal' | 'module';
export type Source = 'projects' | 'products' | 'employees' | 'purchases' | '';
export type FileStatus = 'pending' | 'processing' | 'ready' | 'failed';
export type MessageRole = 'user' | 'assistant' | 'tool';
export type ActionStatus = 'pending' | 'rejected' | 'executed' | 'failed';

export interface AiFile {
  uid: string;
  r2_key: string;
  company_uid: string;
  scope: Scope;
  source: Source;
  owner_uid: string;
  file_name: string;
  content_type: string;
  size: number;
  status: FileStatus;
  chunk_count: number;
  error: string;
  created_at: string;
}

export interface Thread {
  uid: string;
  company_uid: string;
  user_uid: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  file_uid: string;
  file_name: string;
  chunk_index: number;
}

export interface Message {
  uid: string;
  thread_uid: string;
  role: MessageRole;
  /** JSON string of Citation[] when the answer was grounded in documents. */
  citations: string;
  content: string;
  created_at: string;
}

export interface PendingAction {
  uid: string;
  thread_uid: string;
  message_uid: string;
  user_uid: string;
  tool_name: string;
  /** JSON string of the proposed arguments. */
  input: string;
  status: ActionStatus;
  result: string;
  error: string;
  created_at: string;
  executed_at: string;
}

export interface TurnResult {
  messages: Message[];
  pendingAction: PendingAction | null;
}

/** A files-view tab. `module` scope tabs additionally carry a source. */
export interface FilesTab {
  name: string;
  label: string;
  scope?: Scope;
  source?: Source;
  uploadable: boolean;
}
