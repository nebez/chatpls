export type ScorePreset = 'balanced' | 'parody' | 'strict_facts';

export type ScenarioTag =
	| 'easy'
	| 'adversarial'
	| 'business'
	| 'tool-required'
	| 'multi-turn'
	| 'consistency-trap';

export type ToolName =
	| 'calculator'
	| 'translator'
	| 'fact_lookup'
	| 'search_internal_sites'
	| 'refuse_unsafe_request';

export type BranchCondition =
	| { kind: 'always' }
	| { kind: 'turn_score_below'; threshold: number }
	| { kind: 'turn_score_at_least'; threshold: number }
	| { kind: 'semantic_below'; threshold: number }
	| { kind: 'required_tool_not_used'; tool: ToolName }
	| { kind: 'required_tool_used'; tool: ToolName };

export interface ScenarioTransition {
	toTurnId: string;
	when: BranchCondition;
}

export interface ScenarioTurn {
	id: string;
	prompt: string;
	requiredTools?: ToolName[];
	allowedTools?: ToolName[];
	expectedBehavior?: string;
	transitions?: ScenarioTransition[];
	terminal?: boolean;
}

export interface LevelScenario {
	id: string;
	title: string;
	description: string;
	tags: ScenarioTag[];
	systemPrompt: string;
	scoringPreset: ScorePreset;
	entryTurnId: string;
	turns: ScenarioTurn[];
}
