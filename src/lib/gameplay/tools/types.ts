import type { InternalSearchDocument, ToolName } from '../../levels/types';

export type ToolArguments = Record<string, string | number | boolean | undefined>;

export interface PlayerToolCall {
	name: ToolName;
	args: ToolArguments;
}

export interface ToolResult {
	name: ToolName;
	ok: boolean;
	args: ToolArguments;
	content: string;
	documents?: InternalSearchDocument[];
	error?: string;
}

export interface ToolRuntime {
	execute(call: PlayerToolCall): Promise<ToolResult>;
}
