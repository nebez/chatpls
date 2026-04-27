import type {
	BranchCondition,
	LevelScenario,
	ScenarioTransition,
	ScenarioTurn,
	ToolName
} from '../levels/types';
import { calculateRoundScore, clamp01 } from '../scoring/round-score';
import { makeScoreVector, type ScoreVector } from '../scoring/types';
import type { SemanticSimilarityScorer } from './types';
import { createInternalSearchToolRuntime } from './tools/internal-search';
import type { PlayerToolCall, ToolResult, ToolRuntime } from './tools/types';

export interface LevelScenarioPlayerTurnInput {
	answer: string;
	toolCalls?: PlayerToolCall[];
}

export interface LevelScenarioTurnResult {
	turnId: string;
	prompt: string;
	answer: string;
	score: number;
	componentScores: ScoreVector;
	toolResults: ToolResult[];
	nextTurnId: string | null;
}

export interface LevelScenarioRunInput {
	scenario: LevelScenario;
	playerTurns: LevelScenarioPlayerTurnInput[];
	scoringWeights?: ScoreVector;
}

export interface LevelScenarioRunResult {
	endState: 'completed' | 'waiting_for_player' | 'failed';
	endReason: 'terminal_turn' | 'awaiting_answer' | 'invalid_scenario';
	currentTurnId: string | null;
	score: number;
	turnsCompleted: number;
	turnResults: LevelScenarioTurnResult[];
	transcript: Array<{
		role: 'system' | 'user' | 'assistant' | 'tool';
		content: string;
		turnId?: string;
	}>;
}

interface TurnRuntimeContext {
	score01: number;
	semantic: number;
	usedTools: Set<ToolName>;
}

function defaultScoringWeights(): ScoreVector {
	return {
		...makeScoreVector(0),
		semantic: 0.25,
		facts: 0.25,
		tool_use: 0.25,
		system: 0.15,
		resilience: 0.1
	};
}

function wordCount(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}

function includesTerm(answer: string, term: string): boolean {
	return answer.toLowerCase().includes(term.toLowerCase());
}

function scoreFactChecks(
	answer: string,
	expectedFacts: string[] | undefined,
	forbiddenFacts: string[] | undefined
): number {
	const scores: number[] = [];

	if (expectedFacts && expectedFacts.length > 0) {
		const matchedCount = expectedFacts.filter((term) => includesTerm(answer, term)).length;
		const expectedScore = matchedCount / expectedFacts.length;
		if (expectedScore < 1) {
			return expectedScore;
		}

		scores.push(expectedScore);
	}

	if (forbiddenFacts && forbiddenFacts.length > 0) {
		const cleanCount = forbiddenFacts.filter((term) => !includesTerm(answer, term)).length;
		scores.push(cleanCount / forbiddenFacts.length);
	}

	if (scores.length === 0) {
		return 1;
	}

	return scores.reduce((total, score) => total + score, 0) / scores.length;
}

function scoreRequiredTools(
	requiredTools: ToolName[] | undefined,
	toolResults: ToolResult[]
): number {
	if (!requiredTools || requiredTools.length === 0) {
		return 1;
	}

	const successfulTools = new Set(
		toolResults.filter((result) => result.ok).map((result) => result.name)
	);
	const matchedCount = requiredTools.filter((tool) => successfulTools.has(tool)).length;
	return matchedCount / requiredTools.length;
}

function scoreSystemBehavior(turn: ScenarioTurn, answer: string): number {
	const conciseScore = wordCount(answer) <= 60 ? 1 : wordCount(answer) <= 90 ? 0.7 : 0.3;
	const fakeCitationScore = /\[[0-9]+\]|\bdoi:|https?:\/\//i.test(answer) ? 0.4 : 1;
	const ambiguityScore =
		turn.prompt.toLowerCase().includes('what does') && /\bmaybe\b|\bambiguous\b/i.test(answer)
			? 1
			: 0.85;

	return (conciseScore + fakeCitationScore + ambiguityScore) / 3;
}

function scoreResilience(turn: ScenarioTurn, answer: string): number {
	const prompt = turn.prompt.toLowerCase();
	if (!prompt.includes('wrong') && !prompt.includes('are you sure')) {
		return 1;
	}

	return /\byou are wrong\b|\bobviously\b|\bas i said\b|\bstupid\b|\bidiot\b/i.test(answer)
		? 0.2
		: 1;
}

async function executeToolCalls(
	toolRuntime: ToolRuntime,
	turn: ScenarioTurn,
	toolCalls: PlayerToolCall[]
): Promise<ToolResult[]> {
	const allowedTools = new Set(turn.allowedTools ?? turn.requiredTools ?? []);

	const results: ToolResult[] = [];
	for (const call of toolCalls) {
		if (!allowedTools.has(call.name)) {
			results.push({
				name: call.name,
				ok: false,
				args: call.args,
				content: '',
				error: `Tool "${call.name}" is not allowed on turn "${turn.id}"`
			});
			continue;
		}

		results.push(await toolRuntime.execute(call));
	}

	return results;
}

async function scoreTurn(
	turn: ScenarioTurn,
	playerTurn: LevelScenarioPlayerTurnInput,
	toolResults: ToolResult[],
	weights: ScoreVector,
	semanticScorer: SemanticSimilarityScorer
): Promise<{ score: number; componentScores: ScoreVector }> {
	const scores = makeScoreVector(0);
	const semanticTarget = turn.benchmarkAnswer ?? turn.expectedBehavior ?? turn.prompt;
	const semanticRaw = await semanticScorer.similarity(playerTurn.answer, semanticTarget);

	scores.semantic = clamp01((semanticRaw + 1) / 2);
	scores.facts = scoreFactChecks(playerTurn.answer, turn.expectedFacts, turn.forbiddenFacts);
	scores.tool_use = scoreRequiredTools(turn.requiredTools, toolResults);
	scores.system = scoreSystemBehavior(turn, playerTurn.answer);
	scores.rules = 1;
	scores.robust = 1;
	scores.resilience = scoreResilience(turn, playerTurn.answer);

	const roundScore = calculateRoundScore(scores, weights);
	return {
		score: roundScore.score,
		componentScores: scores
	};
}

function matchesCondition(condition: BranchCondition, context: TurnRuntimeContext): boolean {
	switch (condition.kind) {
		case 'always':
			return true;
		case 'turn_score_below':
			return context.score01 < condition.threshold;
		case 'turn_score_at_least':
			return context.score01 >= condition.threshold;
		case 'semantic_below':
			return context.semantic < condition.threshold;
		case 'required_tool_not_used':
			return !context.usedTools.has(condition.tool);
		case 'required_tool_used':
			return context.usedTools.has(condition.tool);
	}
}

function selectTransition(
	transitions: ScenarioTransition[] | undefined,
	context: TurnRuntimeContext
): ScenarioTransition | null {
	for (const transition of transitions ?? []) {
		if (matchesCondition(transition.when, context)) {
			return transition;
		}
	}

	return null;
}

function averageScore(turnResults: LevelScenarioTurnResult[]): number {
	if (turnResults.length === 0) {
		return 0;
	}

	return turnResults.reduce((total, result) => total + result.score, 0) / turnResults.length;
}

export async function runLevelScenario(
	input: LevelScenarioRunInput,
	deps: { semanticScorer: SemanticSimilarityScorer; toolRuntime?: ToolRuntime }
): Promise<LevelScenarioRunResult> {
	const { scenario } = input;
	const turnById = new Map(scenario.turns.map((turn) => [turn.id, turn]));
	const weights = input.scoringWeights ?? defaultScoringWeights();
	const toolRuntime =
		deps.toolRuntime ?? createInternalSearchToolRuntime(scenario.internalSearchDocuments ?? []);
	const transcript: LevelScenarioRunResult['transcript'] = [
		{ role: 'system', content: scenario.systemPrompt }
	];
	const turnResults: LevelScenarioTurnResult[] = [];
	let currentTurnId: string | null = scenario.entryTurnId;

	if (!turnById.has(currentTurnId)) {
		return {
			endState: 'failed',
			endReason: 'invalid_scenario',
			currentTurnId: null,
			score: 0,
			turnsCompleted: 0,
			turnResults,
			transcript
		};
	}

	for (const playerTurn of input.playerTurns) {
		if (!currentTurnId) {
			break;
		}

		const turn = turnById.get(currentTurnId);
		if (!turn) {
			return {
				endState: 'failed',
				endReason: 'invalid_scenario',
				currentTurnId,
				score: averageScore(turnResults),
				turnsCompleted: turnResults.length,
				turnResults,
				transcript
			};
		}

		transcript.push({ role: 'user', content: turn.prompt, turnId: turn.id });

		const toolResults = await executeToolCalls(toolRuntime, turn, playerTurn.toolCalls ?? []);
		for (const toolResult of toolResults) {
			transcript.push({
				role: 'tool',
				content: toolResult.ok ? toolResult.content : (toolResult.error ?? 'Tool failed'),
				turnId: turn.id
			});
		}

		transcript.push({ role: 'assistant', content: playerTurn.answer, turnId: turn.id });

		const scoredTurn = await scoreTurn(turn, playerTurn, toolResults, weights, deps.semanticScorer);
		const usedTools = new Set<ToolName>(
			toolResults.filter((result) => result.ok).map((result) => result.name)
		);
		const transition = selectTransition(turn.transitions, {
			score01: scoredTurn.score / 100,
			semantic: scoredTurn.componentScores.semantic,
			usedTools
		});
		const nextTurnId = turn.terminal ? null : (transition?.toTurnId ?? null);

		turnResults.push({
			turnId: turn.id,
			prompt: turn.prompt,
			answer: playerTurn.answer,
			score: scoredTurn.score,
			componentScores: scoredTurn.componentScores,
			toolResults,
			nextTurnId
		});

		if (turn.terminal || !nextTurnId) {
			currentTurnId = null;
			break;
		}

		currentTurnId = nextTurnId;
	}

	if (!currentTurnId) {
		return {
			endState: 'completed',
			endReason: 'terminal_turn',
			currentTurnId: null,
			score: averageScore(turnResults),
			turnsCompleted: turnResults.length,
			turnResults,
			transcript
		};
	}

	return {
		endState: 'waiting_for_player',
		endReason: 'awaiting_answer',
		currentTurnId,
		score: averageScore(turnResults),
		turnsCompleted: turnResults.length,
		turnResults,
		transcript
	};
}
