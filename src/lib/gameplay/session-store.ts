import { derived, get, writable } from 'svelte/store';
import { makeScoreVector, type ScoreVector } from '../scoring/types';
import { runSingleTurnScenario } from './run-single-turn';
import type { SemanticSimilarityScorer, SingleTurnRunResult, SingleTurnScenarioConfig } from './types';

export type SessionPhase = 'idle' | 'ready' | 'scoring' | 'scenario_complete' | 'failed';
export type RuntimeModelState = 'idle' | 'loading' | 'done' | 'error';

export interface RuntimeModelStatus {
	state: RuntimeModelState;
	latencyMs?: number;
	error?: string;
}

export interface GameSessionState {
	phase: SessionPhase;
	scenario: SingleTurnScenarioConfig | null;
	scoringWeights: ScoreVector;
	latestResult: SingleTurnRunResult | null;
	history: SingleTurnRunResult[];
	modelStatuses: Record<string, RuntimeModelStatus>;
}

export interface CreateGameSessionStoreOptions {
	scoringWeights: ScoreVector;
	semanticScorer: SemanticSimilarityScorer;
	runSingleTurn?: typeof runSingleTurnScenario;
	now?: () => number;
}

export interface LeftPanelViewModel {
	scenarioId: string | null;
	phase: SessionPhase;
	completedCount: number;
}

export interface MainPanelViewModel {
	scenarioId: string | null;
	systemPrompt: string;
	userPrompt: string;
	transcript: Array<{
		role: 'system' | 'user' | 'assistant';
		content: string;
	}>;
}

export interface RightPanelViewModel {
	latestScore: number | null;
	componentScores: ScoreVector;
	modelStatuses: Record<string, RuntimeModelStatus>;
}

export function createGameSessionStore(options: CreateGameSessionStoreOptions) {
	const executeRun = options.runSingleTurn ?? runSingleTurnScenario;
	const now = options.now ?? (() => Date.now());

	const state = writable<GameSessionState>({
		phase: 'idle',
		scenario: null,
		scoringWeights: options.scoringWeights,
		latestResult: null,
		history: [],
		modelStatuses: {}
	});

	const leftPanel = derived(state, ($state): LeftPanelViewModel => ({
		scenarioId: $state.scenario?.id ?? null,
		phase: $state.phase,
		completedCount: $state.history.length
	}));

	const mainPanel = derived(state, ($state): MainPanelViewModel => {
		const transcript =
			$state.latestResult?.transcript ??
			($state.scenario
				? [
						{ role: 'system' as const, content: $state.scenario.systemPrompt },
						{ role: 'user' as const, content: $state.scenario.userPrompt }
					]
				: []);

		return {
			scenarioId: $state.scenario?.id ?? null,
			systemPrompt: $state.scenario?.systemPrompt ?? '',
			userPrompt: $state.scenario?.userPrompt ?? '',
			transcript
		};
	});

	const rightPanel = derived(state, ($state): RightPanelViewModel => ({
		latestScore: $state.latestResult?.score ?? null,
		componentScores: $state.latestResult?.componentScores ?? makeScoreVector(0),
		modelStatuses: $state.modelStatuses
	}));

	function loadScenario(scenario: SingleTurnScenarioConfig): void {
		state.update((current) => ({
			...current,
			phase: 'ready',
			scenario,
			latestResult: null
		}));
	}

	async function submitAnswer(playerAnswer: string, modelId = 'you'): Promise<SingleTurnRunResult> {
		const current = get(state);
		if (!current.scenario) {
			throw new Error('No scenario is loaded');
		}

		const startedAt = now();

		state.update((snapshot) => ({
			...snapshot,
			phase: 'scoring',
			modelStatuses: {
				...snapshot.modelStatuses,
				[modelId]: {
					state: 'loading'
				}
			}
		}));

		try {
			const result = await executeRun(
				{
					scenario: current.scenario,
					playerAnswer,
					scoringWeights: current.scoringWeights
				},
				{ semanticScorer: options.semanticScorer }
			);

			const latencyMs = Math.max(0, now() - startedAt);

			state.update((snapshot) => ({
				...snapshot,
				phase: result.endState === 'completed' ? 'scenario_complete' : 'failed',
				latestResult: result,
				history: [...snapshot.history, result],
				modelStatuses: {
					...snapshot.modelStatuses,
					[modelId]: {
						state: 'done',
						latencyMs
					}
				}
			}));

			return result;
		} catch (error) {
			const latencyMs = Math.max(0, now() - startedAt);
			const message = error instanceof Error ? error.message : 'Unknown error';

			state.update((snapshot) => ({
				...snapshot,
				phase: 'failed',
				modelStatuses: {
					...snapshot.modelStatuses,
					[modelId]: {
						state: 'error',
						latencyMs,
						error: message
					}
				}
			}));

			throw error;
		}
	}

	function reset(): void {
		state.update((current) => ({
			...current,
			phase: 'idle',
			scenario: null,
			latestResult: null,
			history: [],
			modelStatuses: {}
		}));
	}

	return {
		state,
		leftPanel,
		mainPanel,
		rightPanel,
		loadScenario,
		submitAnswer,
		reset
	};
}

export type GameSessionStore = ReturnType<typeof createGameSessionStore>;
