import { describe, expect, it } from 'vitest';
import { makeScoreVector } from '../scoring/types';
import { runSingleTurnScenario } from './run-single-turn';
import { createHfSemanticScorer } from './semantic/hf-semantic-scorer';
import type { SingleTurnRunInput } from './types';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const runIntegration = process.env.RUN_EMBEDDING_INTEGRATION === '1';
const manualResponsesPath = resolve(
	process.cwd(),
	'src/lib/gameplay/single-turn-greeting.responses.local.json'
);
const hasManualResponses = existsSync(manualResponsesPath);

interface ManualResponsesFixture {
	'gpt-5.2': string;
	'sonnet-4.5': string;
	'nova-2.0': string;
}

const baseScoringWeights = {
	...makeScoreVector(0),
	semantic: 0.5,
	rules: 0.2,
	system: 0.2,
	style: 0.1
};

const baseInput: Omit<SingleTurnRunInput, 'playerAnswer'> = {
	scenario: {
		id: 'greeting-hf-001',
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
	scoringWeights: baseScoringWeights
};

describe('single-turn flow integration: huggingface embeddings', () => {
	it.runIf(runIntegration)(
		'runs greeting flow with a real embedding model',
		{ timeout: 180_000 },
		async () => {
			const scorer = createHfSemanticScorer({
				modelId: 'Xenova/all-MiniLM-L6-v2',
				allowRemoteModels: true
			});

			const result = await runSingleTurnScenario(
				{
					...baseInput,
					playerAnswer: 'Hey! Doing well, thanks. How can I help today?'
				},
				{ semanticScorer: scorer }
			);

			expect(result.endState).toBe('completed');
			expect(result.turnsCompleted).toBe(1);
			expect(result.componentScores.semantic).toBeGreaterThan(0.7);
			expect(result.score).toBeGreaterThan(70);
		}
	);

	it.runIf(runIntegration && hasManualResponses)(
		'scores gpt-5.2, sonnet-4.5, and nova-2.0 outputs through the exact same flow',
		{ timeout: 180_000 },
		async () => {
			const scorer = createHfSemanticScorer({
				modelId: 'Xenova/all-MiniLM-L6-v2',
				allowRemoteModels: true
			});
			const responses = JSON.parse(
				readFileSync(manualResponsesPath, 'utf8')
			) as ManualResponsesFixture;

			const labels: Array<keyof ManualResponsesFixture> = ['gpt-5.2', 'sonnet-4.5', 'nova-2.0'];
			const results: Record<string, number> = {};

			for (const label of labels) {
				const run = await runSingleTurnScenario(
					{
						...baseInput,
						playerAnswer: responses[label]
					},
					{ semanticScorer: scorer }
				);

				expect(run.endState).toBe('completed');
				expect(run.endReason).toBe('answered');
				results[label] = run.score;
			}

			expect(Object.keys(results)).toHaveLength(3);
		}
	);
});
