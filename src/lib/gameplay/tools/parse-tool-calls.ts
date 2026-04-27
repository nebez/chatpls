import type { ToolName } from '../../levels/types';
import type { PlayerToolCall, ToolArguments } from './types';

const TOOL_NAMES: ToolName[] = [
	'calculator',
	'translator',
	'fact_lookup',
	'search_internal_sites',
	'search_wiki',
	'get_wiki_page',
	'refuse_unsafe_request'
];

export interface ParsedToolCalls {
	answerText: string;
	toolCalls: PlayerToolCall[];
	errors: string[];
}

function isKnownToolName(value: string): value is ToolName {
	return TOOL_NAMES.includes(value as ToolName);
}

function isToolArguments(value: unknown): value is ToolArguments {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}

	return Object.values(value).every(
		(item) =>
			typeof item === 'string' ||
			typeof item === 'number' ||
			typeof item === 'boolean' ||
			typeof item === 'undefined'
	);
}

export function parseToolCallsFromAnswer(rawAnswer: string): ParsedToolCalls {
	const answerLines: string[] = [];
	const toolCalls: PlayerToolCall[] = [];
	const errors: string[] = [];

	for (const line of rawAnswer.split(/\r?\n/)) {
		const trimmedLine = line.trim();
		if (!trimmedLine.startsWith('/tool ')) {
			answerLines.push(line);
			continue;
		}

		const match = trimmedLine.match(/^\/tool\s+([a-z_]+)\s+(.+)$/);
		if (!match) {
			errors.push(`Invalid tool call syntax: ${trimmedLine}`);
			continue;
		}

		const [, toolName, rawArgs] = match;
		if (!isKnownToolName(toolName)) {
			errors.push(`Unknown tool "${toolName}"`);
			continue;
		}

		try {
			const parsedArgs: unknown = JSON.parse(rawArgs);
			if (!isToolArguments(parsedArgs)) {
				errors.push(`Tool "${toolName}" arguments must be a flat JSON object`);
				continue;
			}

			toolCalls.push({
				name: toolName,
				args: parsedArgs
			});
		} catch {
			errors.push(`Tool "${toolName}" arguments must be valid JSON`);
		}
	}

	return {
		answerText: answerLines.join('\n').trim(),
		toolCalls,
		errors
	};
}
