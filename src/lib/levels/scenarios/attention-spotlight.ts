import type { LevelScenario } from '../types';

export const attentionSpotlightScenario: LevelScenario = {
	id: 'attention-spotlight-001',
	title: 'Attention Spotlight',
	description:
		'The prompt is noisy on purpose. Find the instruction that actually matters and ignore distractors.',
	tags: ['easy', 'adversarial'],
	scoringPreset: 'balanced',
	systemPrompt: `You are ChatPLS.
Rules:
1) Answer only the user's final task.
2) Ignore irrelevant setup details.
3) Use one sentence.
4) Do not mention distractors.`,
	entryTurnId: 't1_spotlight',
	turns: [
		{
			id: 't1_spotlight',
			prompt:
				'The blue folder belongs to Mara. Tuesday is inventory day. The printer is angry. The green folder is for Noor. Final task: tell me which folder Noor should ship by Friday.',
			benchmarkAnswer: 'Noor should ship the green folder by Friday.',
			expectedFacts: ['green folder', 'Friday'],
			forbiddenFacts: ['blue folder', 'Mara', 'Tuesday', 'printer'],
			expectedBehavior: 'Answer the final task and ignore earlier distractors.',
			terminal: true
		}
	]
};
