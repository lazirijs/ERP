import { extractText, getDocumentProxy } from "unpdf";
import Constant from "./constant";
import storage from "../../storage";
import database from "../../database/ai";
import provider from "./providers";
import { ai, vectorize } from "./bindings";
import type { FilesIndexType, IngestMessageType } from "./type";

const chunkText = (text: string): string[] => {
    const { size, overlap } = Constant.chunk;
    const chunks: string[] = [];

    for (let start = 0; start < text.length; start += size - overlap) {
        const chunk = text.slice(start, start + size).trim();
        if (chunk) chunks.push(chunk);
        if (start + size >= text.length) break;
    }

    return chunks;
};

/**
 * Pulls the text out of a stored file.
 *
 * PDFs do not go through toMarkdown. It parses a PDF's StructTree, and on a
 * perfectly ordinary tagged CV exported from a design tool it returned nothing
 * but the metadata dictionary (PDFFormatVersion, Creator, ...) -- which then got
 * embedded and answered questions with. unpdf reads the same file's text layer
 * fine, so it does PDFs and toMarkdown keeps everything else (docx, xlsx, csv,
 * html, images).
 */
const extract = async (file: FilesIndexType, buffer: ArrayBuffer): Promise<string> => {
    const isPdf = file.content_type === "application/pdf" || file.file_name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const { text } = await extractText(pdf, { mergePages: true });
        if (text.trim()) return text;
        // An image-only PDF has no text layer -- fall through and let toMarkdown
        // describe it, which is better than nothing but is not OCR.
    }

    const converted = await ai.toMarkdown({
        name: file.file_name,
        blob: new Blob([buffer], { type: file.content_type || undefined })
    });

    // Conversion reports failure in-band rather than throwing.
    if (converted.format === "error") throw new Error(converted.error || "This file could not be read");

    return converted.data ?? "";
};

const setStatus = (uid: string, status: FilesIndexType["status"], fields: { chunk_count?: number; error?: string } = {}) =>
    database.prepare(`
        UPDATE files_index
        SET status = ?, chunk_count = ?, error = ?
        WHERE uid = ?
    `).bind(status, fields.chunk_count ?? 0, fields.error ?? "", uid).run();

export default async function ingest({ file_uid }: IngestMessageType) {
    const file = await database.prepare("SELECT * FROM files_index WHERE uid = ?")
        .bind(file_uid)
        .first<FilesIndexType>();

    if (!file) return;

    try {
        await setStatus(file_uid, "processing");

        const object = await storage.get(file.r2_key);
        if (!object) throw new Error("File not found in storage");

        const text = await extract(file, await object.arrayBuffer());

        const chunks = chunkText(text);
        if (!chunks.length) {
            throw new Error("No readable text found in this file. If it is a scan or a photo, its text cannot be read yet.");
        }

        // Drop any vectors from a previous attempt so a retry cannot leave orphans.
        if (file.chunk_count > 0) {
            await vectorize.deleteByIds(
                Array.from({ length: file.chunk_count }, (_, index) => `${ file_uid }:${ index }`)
            );
        }

        for (let offset = 0; offset < chunks.length; offset += Constant.upsertBatchSize) {
            const batch = chunks.slice(offset, offset + Constant.upsertBatchSize);
            const embeddings = await provider.embed(batch);

            await vectorize.upsert(batch.map((chunk, index) => ({
                id: `${ file_uid }:${ offset + index }`,
                values: embeddings[index]!,
                // Retrieval filters on this metadata -- it is what enforces scoping.
                metadata: {
                    company_uid: file.company_uid,
                    // Vectorize has no $or, so visibility is collapsed into one
                    // filterable tag at write time: company/module docs are readable
                    // by anyone in the company, personal docs only by their owner.
                    access: file.scope === "personal" ? `user:${ file.owner_uid }` : "company",
                    scope: file.scope,
                    source: file.source,
                    owner_uid: file.owner_uid,
                    file_uid,
                    file_name: file.file_name,
                    chunk_index: offset + index,
                    text: chunk
                }
            })));
        }

        await setStatus(file_uid, "ready", { chunk_count: chunks.length });
    } catch (error: any) {
        await setStatus(file_uid, "failed", { error: error?.message || "Ingestion failed" });
        throw error;
    }
}
