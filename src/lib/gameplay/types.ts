import type { ScoreVector } from '../scoring/types';

export interface GreetingRuleConfig {
	greetBack?: boolean;
	offerHelp?: boolean;
}

export interface UserRuleConfig {
	exactWordCount?: number;
}

export interface SystemRuleConfig {
	englishOnly?: boolean;
	maxWords?: number;
	greeting?: GreetingRuleConfig;
}

export type ScoringPriority = 'balanced' | 'system_over_user' | 'user_over_system';

export interface ScoringPolicyConfig {
	priority?: ScoringPriority;
}

export interface SingleTurnScenarioConfig {
	id: string;
	systemPrompt: string;
	systemRules: SystemRuleConfig;
	userRules?: UserRuleConfig;
	scoringPolicy?: ScoringPolicyConfig;
	userPrompt: string;
	benchmarkAnswer: string;
}

export interface SingleTurnRunInput {
	scenario: SingleTurnScenarioConfig;
	playerAnswer: string;
	scoringWeights: ScoreVector;
}

export interface SingleTurnRunResult {
	score: number;
	componentScores: ScoreVector;
	endState: 'completed' | 'failed';
	endReason: 'answered' | 'refused' | 'invalid_output';
	turnsCompleted: number;
	transcript: Array<{
		role: 'system' | 'user' | 'assistant';
		content: string;
	}>;
}

export interface SemanticSimilarityScorer {
	// Cosine similarity in [-1, 1].
	similarity(a: string, b: string): Promise<number>;
}
