import { describe, expect, it } from 'vitest';
import { createWikiToolRuntime, type FetchLike } from './wiki';

function jsonResponse(value: unknown): Response {
	return new Response(JSON.stringify(value), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
}

describe('createWikiToolRuntime', () => {
	it('searches Wikipedia through the Action API shape', async () => {
		const calls: string[] = [];
		const fetchImpl: FetchLike = async (input) => {
			const url = String(input);
			calls.push(url);
			return jsonResponse({
				query: {
					search: [
						{
							pageid: 5042916,
							title: 'Strawberry',
							snippet: 'The <span>strawberry</span> is a widely grown hybrid species.'
						}
					]
				}
			});
		};
		const runtime = createWikiToolRuntime({ fetchImpl });

		const result = await runtime.execute({
			name: 'search_wiki',
			args: { query: 'strawberry fruit', limit: 1 }
		});

		expect(result.ok).toBe(true);
		expect(result.documents?.[0]).toMatchObject({
			id: '5042916',
			title: 'Strawberry',
			body: 'The strawberry is a widely grown hybrid species.'
		});
		expect(result.content).toContain('https://en.wikipedia.org/wiki/Strawberry');
		expect(calls[0]).toContain('list=search');
		expect(calls[0]).toContain('srsearch=strawberry+fruit');
	});

	it('loads a Wikipedia page extract through the Action API shape', async () => {
		const fetchImpl: FetchLike = async () =>
			jsonResponse({
				query: {
					pages: {
						'5042916': {
							pageid: 5042916,
							title: 'Strawberry',
							extract: 'The garden strawberry is a widely grown hybrid species.'
						}
					}
				}
			});
		const runtime = createWikiToolRuntime({ fetchImpl });

		const result = await runtime.execute({
			name: 'get_wiki_page',
			args: { title: 'Strawberry' }
		});

		expect(result.ok).toBe(true);
		expect(result.content).toContain('The garden strawberry');
		expect(result.content).toContain('Source: https://en.wikipedia.org/wiki/Strawberry');
	});

	it('returns structured tool errors for missing wiki queries', async () => {
		const runtime = createWikiToolRuntime({
			fetchImpl: async () => {
				throw new Error('should not fetch');
			}
		});

		const result = await runtime.execute({
			name: 'search_wiki',
			args: { query: '' }
		});

		expect(result).toMatchObject({
			ok: false,
			error: 'search_wiki requires a non-empty query'
		});
	});
});
