import { env } from 'cloudflare:workers'

// Cloudflare bindings
export const ai = env.AI;                  // AI = Workers AI (inference + toMarkdown)
export const vectorize = env.VECTORIZE;    // VECTORIZE = vector index
export const ingestQueue = env.INGEST_QUEUE; // INGEST_QUEUE = async document ingestion
