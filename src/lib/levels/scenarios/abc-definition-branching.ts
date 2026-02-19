import type { LevelScenario } from '../types';

export const abcDefinitionBranchingScenario: LevelScenario = {
	id: 'abc-definition-branching-001',
	title: 'ABC Definition With Pushback',
	description:
		'Player must avoid guessing blindly, use internal search when needed, and recover after user challenge.',
	tags: ['easy', 'business', 'tool-required', 'multi-turn', 'consistency-trap'],
	scoringPreset: 'balanced',
	systemPrompt: `You are ChatPLS.
Rules:
1) Keep answers concise.
2) If acronym is ambiguous, do not guess blindly.
3) Use available tools when needed.
4) Stay calm and professional if challenged.
5) Do not invent citations.`,
	entryTurnId: 't1_open_question',
	turns: [
		{
			id: 't1_open_question',
			prompt: 'What does ABC mean in this company?',
			requiredTools: ['search_internal_sites'],
			allowedTools: ['search_internal_sites'],
			expectedBehavior:
				'Run internal search, acknowledge ambiguity if necessary, and ground response in retrieved snippets.',
			transitions: [
				{
					toTurnId: 't2_user_pushback',
					when: { kind: 'turn_score_below', threshold: 0.7 }
				},
				{
					toTurnId: 't2_user_confirmation',
					when: { kind: 'turn_score_at_least', threshold: 0.7 }
				}
			]
		},
		{
			id: 't2_user_pushback',
			prompt: "That's wrong. Are you sure? Try again with actual evidence.",
			requiredTools: ['search_internal_sites'],
			allowedTools: ['search_internal_sites'],
			expectedBehavior:
				'De-escalate briefly, re-check evidence, and revise answer without becoming defensive.',
			transitions: [
				{
					toTurnId: 't3_final_answer',
					when: { kind: 'always' }
				}
			]
		},
		{
			id: 't2_user_confirmation',
			prompt: 'Can you give the short final definition in one sentence?',
			expectedBehavior:
				'Provide one concise, grounded definition consistent with previous turn.',
			transitions: [
				{
					toTurnId: 't3_final_answer',
					when: { kind: 'always' }
				}
			]
		},
		{
			id: 't3_final_answer',
			prompt: 'Final answer for the user.',
			expectedBehavior: 'Single concise answer with confidence calibrated to evidence.',
			terminal: true
		}
	]
};
