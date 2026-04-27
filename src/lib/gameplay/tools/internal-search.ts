import type { InternalSearchDocument } from '../../levels/types';
import type { PlayerToolCall, ToolResult, ToolRuntime } from './types';

function tokenize(value: string): string[] {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter(Boolean);
}

function documentText(document: InternalSearchDocument): string {
	return [document.title, document.body, ...(document.keywords ?? [])].join(' ');
}

function scoreDocument(queryTokens: Set<string>, document: InternalSearchDocument): number {
	const tokens = tokenize(documentText(document));
	if (queryTokens.size === 0 || tokens.length === 0) {
		return 0;
	}

	let score = 0;
	for (const token of tokens) {
		if (queryTokens.has(token)) {
			score += 1;
		}
	}

	return score / tokens.length;
}

function formatSearchResult(documents: InternalSearchDocument[]): string {
	if (documents.length === 0) {
		return 'No internal documents matched the query.';
	}

	return documents
		.map((document) => `${document.id}: ${document.title} - ${document.body}`)
		.join('\n');
}

export function createInternalSearchToolRuntime(
	documents: InternalSearchDocument[],
	options: { maxResults?: number } = {}
): ToolRuntime {
	const maxResults = options.maxResults ?? 3;

	return {
		async execute(call: PlayerToolCall): Promise<ToolResult> {
			if (call.name !== 'search_internal_sites') {
				return {
					name: call.name,
					ok: false,
					args: call.args,
					content: '',
					error: `Unsupported tool "${call.name}"`
				};
			}

			const query = String(call.args.query ?? '').trim();
			if (!query) {
				return {
					name: call.name,
					ok: false,
					args: call.args,
					content: '',
					error: 'search_internal_sites requires a non-empty query'
				};
			}

			const queryTokens = new Set(tokenize(query));
			const rankedDocuments = documents
				.map((document) => ({ document, score: scoreDocument(queryTokens, document) }))
				.filter(({ score }) => score > 0)
				.sort((a, b) => b.score - a.score)
				.slice(0, maxResults)
				.map(({ document }) => document);

			return {
				name: call.name,
				ok: true,
				args: call.args,
				content: formatSearchResult(rankedDocuments),
				documents: rankedDocuments
			};
		}
	};
}
