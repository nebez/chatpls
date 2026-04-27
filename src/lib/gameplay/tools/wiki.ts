import type { InternalSearchDocument } from '../../levels/types';
import type { PlayerToolCall, ToolResult, ToolRuntime } from './types';

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface WikiToolRuntimeOptions {
	fetchImpl?: FetchLike;
	apiBaseUrl?: string;
}

interface WikiSearchItem {
	pageid: number;
	title: string;
	snippet?: string;
}

interface WikiSearchResponse {
	query?: {
		search?: WikiSearchItem[];
	};
}

interface WikiPageResponse {
	query?: {
		pages?: Record<
			string,
			{
				pageid?: number;
				title?: string;
				extract?: string;
			}
		>;
	};
}

function stripHtml(value: string): string {
	return value
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function wikiUrl(title: string): string {
	return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
}

function toDocument(item: WikiSearchItem): InternalSearchDocument {
	return {
		id: String(item.pageid),
		title: item.title,
		body: stripHtml(item.snippet ?? ''),
		keywords: ['wikipedia', item.title]
	};
}

async function fetchJson<T>(fetchImpl: FetchLike, url: URL): Promise<T> {
	const response = await fetchImpl(url);
	if (!response.ok) {
		throw new Error(`Wikipedia request failed with ${response.status}`);
	}

	return (await response.json()) as T;
}

export function createWikiToolRuntime(options: WikiToolRuntimeOptions = {}): ToolRuntime {
	const fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
	const apiBaseUrl = options.apiBaseUrl ?? 'https://en.wikipedia.org/w/api.php';

	return {
		async execute(call: PlayerToolCall): Promise<ToolResult> {
			if (call.name === 'search_wiki') {
				const query = String(call.args.query ?? '').trim();
				const limit = Math.max(1, Math.min(5, Number(call.args.limit ?? 3)));

				if (!query) {
					return {
						name: call.name,
						ok: false,
						args: call.args,
						content: '',
						error: 'search_wiki requires a non-empty query'
					};
				}

				try {
					const url = new URL(apiBaseUrl);
					url.search = new URLSearchParams({
						action: 'query',
						format: 'json',
						origin: '*',
						list: 'search',
						srsearch: query,
						srlimit: String(limit)
					}).toString();

					const payload = await fetchJson<WikiSearchResponse>(fetchImpl, url);
					const documents = (payload.query?.search ?? []).map(toDocument);

					return {
						name: call.name,
						ok: true,
						args: call.args,
						content:
							documents.length === 0
								? 'No Wikipedia pages matched the query.'
								: documents
										.map(
											(document) =>
												`${document.id}: ${document.title} - ${document.body} - ${wikiUrl(document.title)}`
										)
										.join('\n'),
						documents
					};
				} catch (error) {
					return {
						name: call.name,
						ok: false,
						args: call.args,
						content: '',
						error: error instanceof Error ? error.message : 'Wikipedia search failed'
					};
				}
			}

			if (call.name === 'get_wiki_page') {
				const title = String(call.args.title ?? '').trim();

				if (!title) {
					return {
						name: call.name,
						ok: false,
						args: call.args,
						content: '',
						error: 'get_wiki_page requires a non-empty title'
					};
				}

				try {
					const url = new URL(apiBaseUrl);
					url.search = new URLSearchParams({
						action: 'query',
						format: 'json',
						origin: '*',
						prop: 'extracts',
						exintro: '1',
						explaintext: '1',
						redirects: '1',
						titles: title
					}).toString();

					const payload = await fetchJson<WikiPageResponse>(fetchImpl, url);
					const page = Object.values(payload.query?.pages ?? {})[0];
					const pageTitle = page?.title ?? title;
					const extract = page?.extract?.trim() ?? '';

					return {
						name: call.name,
						ok: true,
						args: call.args,
						content: extract
							? `${pageTitle}: ${extract}\nSource: ${wikiUrl(pageTitle)}`
							: `No extract found for ${title}.`,
						documents: [
							{
								id: String(page?.pageid ?? pageTitle),
								title: pageTitle,
								body: extract,
								keywords: ['wikipedia', pageTitle]
							}
						]
					};
				} catch (error) {
					return {
						name: call.name,
						ok: false,
						args: call.args,
						content: '',
						error: error instanceof Error ? error.message : 'Wikipedia page lookup failed'
					};
				}
			}

			return {
				name: call.name,
				ok: false,
				args: call.args,
				content: '',
				error: `Unsupported tool "${call.name}"`
			};
		}
	};
}
