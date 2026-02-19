import { describe, expect, it } from 'vitest';
import { calculateRoundScore } from '../scoring/round-score';
import { makeScoreVector, type ScoreVector } from '../scoring/types';
import { runSingleTurnScenario } from './run-single-turn';
import type { SemanticSimilarityScorer, SingleTurnRunInput } from './types';

class FixedSemanticScorer implements SemanticSimilarityScorer {
	constructor(private readonly value: number) {}

	async similarity(_a: string, _b: string): Promise<number> {
		return this.value;
	}
}

describe('single-turn flow contract: greeting', () => {
	it('scores a basic greeting and ends in completed state', async () => {
		const scoringWeights = {
			...makeScoreVector(0),
			semantic: 0.35,
			rules: 0.2,
			system: 0.2,
			style: 0.1,
			robust: 0.1,
			resilience: 0.05
		};

		const input: SingleTurnRunInput = {
			scenario: {
				id: 'greeting-001',
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
			},
			playerAnswer: 'Hey! Doing well, thanks. How can I help today?',
			scoringWeights
		};

		const result = await runSingleTurnScenario(input, {
			semanticScorer: new FixedSemanticScorer(0.92)
		});

		const expected = calculateRoundScore(result.componentScores, scoringWeights);

		expect(result.endState).toBe('completed');
		expect(result.endReason).toBe('answered');
		expect(result.turnsCompleted).toBe(1);
		expect(result.score).toBeGreaterThanOrEqual(70);
		expect(result.score).toBeLessThanOrEqual(100);
		expect(result.score).toBeCloseTo(expected.score, 6);
		expect(result.componentScores.system).toBeGreaterThanOrEqual(0.9);
		expect(result.componentScores.rules).toBeGreaterThanOrEqual(0.9);
		expect(result.transcript).toEqual([
			{ role: 'system', content: expect.stringContaining('12 words max') },
			{ role: 'user', content: 'hey how are you?' },
			{ role: 'assistant', content: 'Hey! Doing well, thanks. How can I help today?' }
		]);
	});

	it('can prioritize user constraint scoring over system constraint scoring in conflict scenarios', async () => {
		const baseWeights = {
			...makeScoreVector(0),
			semantic: 0.25,
			rules: 0.35,
			system: 0.35,
			style: 0.05
		};

		const baseScenario = {
			id: 'greeting-conflict-001',
			systemPrompt: `You are ChatPLS.
Rules:
1) If greeted, greet back and offer help.
2) Keep responses under 12 words.`,
			systemRules: {
				maxWords: 12,
				greeting: {
					greetBack: true,
					offerHelp: true
				}
			},
			userRules: {
				exactWordCount: 1
			},
			userPrompt: 'hey how are you? reply in exactly one word',
			benchmarkAnswer: 'Good.'
		} as const;

		const playerAnswer = 'Good';

		const userPriorityResult = await runSingleTurnScenario(
			{
				scenario: {
					...baseScenario,
					scoringPolicy: { priority: 'user_over_system' }
				},
				playerAnswer,
				scoringWeights: baseWeights
			},
			{ semanticScorer: new FixedSemanticScorer(0.9) }
		);

		const systemPriorityResult = await runSingleTurnScenario(
			{
				scenario: {
					...baseScenario,
					scoringPolicy: { priority: 'system_over_user' }
				},
				playerAnswer,
				scoringWeights: baseWeights
			},
			{ semanticScorer: new FixedSemanticScorer(0.9) }
		);

		expect(userPriorityResult.endState).toBe('completed');
		expect(systemPriorityResult.endState).toBe('completed');
		expect(userPriorityResult.score).toBeGreaterThan(systemPriorityResult.score);
		expect(userPriorityResult.componentScores.rules).toBeGreaterThan(
			userPriorityResult.componentScores.system
		);
	});
});
