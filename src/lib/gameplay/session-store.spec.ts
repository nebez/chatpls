import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { makeScoreVector } from '../scoring/types';
import { createGameSessionStore } from './session-store';
import type { SemanticSimilarityScorer, SingleTurnScenarioConfig } from './types';

class FixedSemanticScorer implements SemanticSimilarityScorer {
	constructor(private readonly fixedSimilarity: number) {}

	async similarity(_a: string, _b: string): Promise<number> {
		return this.fixedSimilarity;
	}
}

describe('game session store', () => {
	it('shares scenario context across panels and reaches scenario_complete after submit', async () => {
		let clock = 1_000;
		const store = createGameSessionStore({
			scoringWeights: {
				...makeScoreVector(0),
				semantic: 0.35,
				rules: 0.2,
				system: 0.2,
				style: 0.1,
				robust: 0.1,
				resilience: 0.05
			},
			semanticScorer: new FixedSemanticScorer(0.9),
			now: () => {
				clock += 25;
				return clock;
			}
		});

		const scenario: SingleTurnScenarioConfig = {
			id: 'greeting-session-001',
			systemPrompt: `You are ChatPLS.
Rules:
1) English only.
2) Keep answers to 12 words max.
3) Be friendly.
4) If greeted, greet back and offer help.`,
			systemRules: {
				englishOnly: true,
				maxWords: 12,
				greeting: {
					greetBack: true,
					offerHelp: true
				}
			},
			userPrompt: 'hey how are you?',
			benchmarkAnswer: 'Hey! I am doing well, thanks. How can I help today?'
		};

		store.loadScenario(scenario);

		const leftBefore = get(store.leftPanel);
		const mainBefore = get(store.mainPanel);
		const rightBefore = get(store.rightPanel);

		expect(leftBefore.scenarioId).toBe('greeting-session-001');
		expect(leftBefore.phase).toBe('ready');
		expect(mainBefore.systemPrompt).toContain('You are ChatPLS.');
		expect(mainBefore.userPrompt).toBe('hey how are you?');
		expect(rightBefore.latestScore).toBeNull();

		await store.submitAnswer('Hey! Doing well, thanks. How can I help today?', 'you');

		const leftAfter = get(store.leftPanel);
		const mainAfter = get(store.mainPanel);
		const rightAfter = get(store.rightPanel);

		expect(leftAfter.phase).toBe('scenario_complete');
		expect(leftAfter.completedCount).toBe(1);
		expect(mainAfter.transcript).toHaveLength(3);
		expect(mainAfter.transcript[2]).toEqual({
			role: 'assistant',
			content: 'Hey! Doing well, thanks. How can I help today?'
		});
		expect(rightAfter.latestScore).not.toBeNull();
		expect(rightAfter.modelStatuses.you.state).toBe('done');
		expect(rightAfter.modelStatuses.you.latencyMs).toBeGreaterThanOrEqual(25);
	});
});
