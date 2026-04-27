import { describe, expect, it } from 'vitest';
import { parseToolCallsFromAnswer } from './parse-tool-calls';

describe('parseToolCallsFromAnswer', () => {
	it('extracts hard-mode tool calls and leaves final answer text', () => {
		const parsed = parseToolCallsFromAnswer(
			'/tool search_internal_sites {"query":"ABC finance"}\nABC means Annual Budget Cycle.'
		);

		expect(parsed.errors).toEqual([]);
		expect(parsed.answerText).toBe('ABC means Annual Budget Cycle.');
		expect(parsed.toolCalls).toEqual([
			{
				name: 'search_internal_sites',
				args: { query: 'ABC finance' }
			}
		]);
	});

	it('reports invalid tool syntax without treating it as answer text', () => {
		const parsed = parseToolCallsFromAnswer('/tool search_internal_sites nope');

		expect(parsed.answerText).toBe('');
		expect(parsed.toolCalls).toEqual([]);
		expect(parsed.errors).toEqual(['Tool "search_internal_sites" arguments must be valid JSON']);
	});

	it('rejects unknown tool names', () => {
		const parsed = parseToolCallsFromAnswer('/tool vibes {"query":"ABC"}');

		expect(parsed.toolCalls).toEqual([]);
		expect(parsed.errors).toEqual(['Unknown tool "vibes"']);
	});
});
