import { t } from "elysia";
import Constant from "../constant";
import provider from "../providers";
import database from "../../../database/ai";
import { vectorize } from "../bindings";
import type { Tool } from "./type";
import type { CallerType, CitationType } from "../type";

const searchBody = t.Object({
    query: t.String({ minLength: 2, maxLength: 500 })
});

type VectorizeMatchMetadata = {
    file_uid: string;
    file_name: string;
    chunk_index: number;
    text: string;
};

/**
 * The filter that enforces document scoping.
 *
 * Vectorize supports only $eq/$ne/$in/$nin/$lt/$lte/$gt/$gte -- there is no $or --
 * so visibility is precomputed into a single `access` tag at ingest time:
 * company and per-module docs are tagged "company", personal docs "user:<owner>".
 * A caller may read either bucket, which is one $in rather than an OR.
 *
 * Both fields must have a Vectorize metadata index or this filter silently
 * matches nothing useful. See the provisioning steps in the plan.
 */
const scopeFilter = (caller: CallerType) => ({
    company_uid: { $eq: caller.company_uid },
    access: { $in: ["company", `user:${ caller.uid }`] }
});

const searchDocuments: Tool = {
    name: "search_documents",
    description:
        "Search the company's uploaded documents (contracts, invoices, reports, specs, scanned files) and return the most relevant excerpts. " +
        "Call this whenever the user asks a question whose answer would come from a document rather than from live ERP records, " +
        "or when they refer to something 'in the file', 'in the contract', or 'in the report'. Do not answer document questions from memory.",
    schema: searchBody,
    kind: "read",

    async execute({ query }: typeof searchBody.static, caller) {
        const [embedding] = await provider.embed([query]);

        const result = await vectorize.query(embedding!, {
            topK: Constant.retrieval.topK,
            returnMetadata: "all",
            filter: scopeFilter(caller) as any
        });

        const metadata = result.matches.map(match => ({
            score: match.score,
            ...(match.metadata as unknown as VectorizeMatchMetadata)
        }));

        // Vectorize deletes are eventually consistent (observed ~45s), so a
        // just-deleted document keeps matching. The ledger is immediately
        // consistent, so it decides what the user is actually allowed to see --
        // otherwise the assistant goes on quoting a file they already removed.
        const matched = [...new Set(metadata.map(item => item.file_uid))];
        const live = new Set<string>();

        if (matched.length) {
            const { results } = await database.prepare(`
                SELECT uid FROM files_index
                WHERE uid IN (${ matched.map(() => "?").join(", ") })
            `).bind(...matched).all<{ uid: string }>();
            for (const row of results) live.add(row.uid);
        }

        const surviving = metadata.filter(item => live.has(item.file_uid));

        const excerpts = surviving.map(item => ({
            file_name: item.file_name,
            score: item.score,
            text: item.text
        }));

        const citations: CitationType[] = surviving.map(item => ({
            file_uid: item.file_uid,
            file_name: item.file_name,
            chunk_index: item.chunk_index
        }));

        if (!excerpts.length) {
            return { excerpts: [], note: "No matching documents. Tell the user nothing relevant was found rather than guessing." };
        }

        return { excerpts, citations };
    }
};

export default [searchDocuments];
