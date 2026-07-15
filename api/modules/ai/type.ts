import Schema from './schema'

export type FilesIndexType = typeof Schema.data.file.static
export type ChatThreadType = typeof Schema.data.thread.static
export type ChatMessageType = typeof Schema.data.message.static
export type PendingActionType = typeof Schema.data.pendingAction.static
export type ScopeType = typeof Schema.data.scope.static
export type SourceType = typeof Schema.data.source.static

export type UploadFileQueryType = typeof Schema.uploadFile.validation.query.static
export type ScopeQueryType = typeof Schema.getFiles.validation.query.static
export type SendMessageBodyType = typeof Schema.sendMessage.validation.body.static
export type CreateThreadBodyType = typeof Schema.createThread.validation.body.static

/** The authenticated caller, as resolved by the auth plugin macro. */
export type CallerType = {
    uid: string;
    company_uid: string;
};

/** Queue payload for async ingestion. */
export type IngestMessageType = {
    file_uid: string;
};

/** A file as shown in the Files view: R2 listing joined with its ingestion status. */
export type FileListItemType = FilesIndexType & {
    /** True when the R2 object exists but has no ledger row (uploaded outside the AI flow). */
    orphaned?: boolean;
};

export type CitationType = {
    file_uid: string;
    file_name: string;
    chunk_index: number;
};
