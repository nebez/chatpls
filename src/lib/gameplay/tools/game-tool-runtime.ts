import type { InternalSearchDocument } from '../../levels/types';
import { createInternalSearchToolRuntime } from './internal-search';
import { createWikiToolRuntime, type FetchLike } from './wiki';
import type { PlayerToolCall, ToolResult, ToolRuntime } from './types';

export interface GameToolRuntimeOptions {
	internalSearchDocuments?: InternalSearchDocument[];
	fetchImpl?: FetchLike;
}

export function createGameToolRuntime(options: GameToolRuntimeOptions = {}): ToolRuntime {
	const internalSearch = createInternalSearchToolRuntime(options.internalSearchDocuments ?? []);
	const wiki = createWikiToolRuntime({ fetchImpl: options.fetchImpl });

	return {
		async execute(call: PlayerToolCall): Promise<ToolResult> {
			if (call.name === 'search_internal_sites') {
				return internalSearch.execute(call);
			}

			if (call.name === 'search_wiki' || call.name === 'get_wiki_page') {
				return wiki.execute(call);
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
