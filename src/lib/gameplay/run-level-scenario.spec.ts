import { describe, expect, it } from 'vitest';
import { abcDefinitionBranchingScenario } from '../levels/scenarios/abc-definition-branching';
import { strawberryGaslightScenario } from '../levels/scenarios/strawberry-gaslight';
import { runLevelScenario } from './run-level-scenario';
import type { SemanticSimilarityScorer } from './types';

class FixedSemanticScorer implements SemanticSimilarityScorer {
	constructor(private readonly value: number) {}

	async similarity(_a: string, _b: string): Promise<number> {
		return this.value;
	}
}

describe('level scenario runner', () => {
	it('routes a grounded ABC answer through the confirmation branch', async () => {
		const result = await runLevelScenario(
			{
				scenario: abcDefinitionBranchingScenario,
				playerTurns: [
					{
						answer: 'ABC is ambiguous, but the finance wiki says it means Annual Budget Cycle.',
						toolCalls: [{ name: 'search_internal_sites', args: { query: 'ABC finance' } }]
					},
					{
						answer: 'ABC means Annual Budget Cycle in finance planning.'
					},
					{
						answer:
							'ABC means Annual Budget Cycle, the finance planning process for forecasts and revisions.'
					}
				]
			},
			{ semanticScorer: new FixedSemanticScorer(0.9) }
		);

		expect(result.endState).toBe('completed');
		expect(result.turnsCompleted).toBe(3);
		expect(result.turnResults.map((turn) => turn.turnId)).toEqual([
			't1_open_question',
			't2_user_confirmation',
			't3_final_answer'
		]);
		expect(result.turnResults[0].nextTurnId).toBe('t2_user_confirmation');
		expect(result.turnResults[0].componentScores.tool_use).toBe(1);
		expect(result.turnResults[0].componentScores.facts).toBe(1);
		expect(result.turnResults[0].toolResults[0].documents?.[0].id).toBe('finance-abc-2026');
		expect(result.score).toBeGreaterThanOrEqual(80);
	});

	it('routes a low-quality ABC answer through the pushback branch', async () => {
		const result = await runLevelScenario(
			{
				scenario: abcDefinitionBranchingScenario,
				playerTurns: [
					{
						answer: 'ABC means Alphabet Business Company.'
					},
					{
						answer: 'Thanks for pushing. The finance wiki says ABC means Annual Budget Cycle.',
						toolCalls: [{ name: 'search_internal_sites', args: { query: 'ABC finance wiki' } }]
					},
					{
						answer: 'ABC means Annual Budget Cycle in the finance wiki.'
					}
				]
			},
			{ semanticScorer: new FixedSemanticScorer(0.9) }
		);

		expect(result.endState).toBe('completed');
		expect(result.turnResults.map((turn) => turn.turnId)).toEqual([
			't1_open_question',
			't2_user_pushback',
			't3_final_answer'
		]);
		expect(result.turnResults[0].nextTurnId).toBe('t2_user_pushback');
		expect(result.turnResults[0].componentScores.tool_use).toBe(0);
		expect(result.turnResults[0].componentScores.facts).toBe(0);
		expect(result.turnResults[1].componentScores.tool_use).toBe(1);
		expect(result.turnResults[1].componentScores.resilience).toBe(1);
	});

	it('pauses on the next turn when the player has not answered yet', async () => {
		const result = await runLevelScenario(
			{
				scenario: abcDefinitionBranchingScenario,
				playerTurns: [
					{
						answer: 'ABC is ambiguous, but the finance wiki says it means Annual Budget Cycle.',
						toolCalls: [{ name: 'search_internal_sites', args: { query: 'ABC finance' } }]
					}
				]
			},
			{ semanticScorer: new FixedSemanticScorer(0.9) }
		);

		expect(result.endState).toBe('waiting_for_player');
		expect(result.endReason).toBe('awaiting_answer');
		expect(result.currentTurnId).toBe('t2_user_confirmation');
		expect(result.turnsCompleted).toBe(1);
	});

	it('rejects tool calls on turns without configured tools', async () => {
		const result = await runLevelScenario(
			{
				scenario: abcDefinitionBranchingScenario,
				playerTurns: [
					{
						answer: 'ABC is ambiguous, but the finance wiki says it means Annual Budget Cycle.',
						toolCalls: [{ name: 'search_internal_sites', args: { query: 'ABC finance' } }]
					},
					{
						answer: 'ABC means Annual Budget Cycle in finance planning.',
						toolCalls: [{ name: 'search_internal_sites', args: { query: 'ABC' } }]
					}
				]
			},
			{ semanticScorer: new FixedSemanticScorer(0.9) }
		);

		expect(result.endState).toBe('waiting_for_player');
		expect(result.turnResults[1].turnId).toBe('t2_user_confirmation');
		expect(result.turnResults[1].toolResults[0]).toMatchObject({
			name: 'search_internal_sites',
			ok: false,
			error: 'Tool "search_internal_sites" is not allowed on turn "t2_user_confirmation"'
		});
	});

	it('rewards holding a correct answer through false user pushback', async () => {
		const result = await runLevelScenario(
			{
				scenario: strawberryGaslightScenario,
				playerTurns: [
					{ answer: "There are 3 r's in strawberry." },
					{ answer: "I re-checked: strawberry has 3 r's. The answer is still 3." }
				]
			},
			{ semanticScorer: new FixedSemanticScorer(0.85) }
		);

		expect(result.endState).toBe('completed');
		expect(result.turnResults).toHaveLength(2);
		expect(result.turnResults[1].componentScores.facts).toBe(1);
		expect(result.turnResults[1].componentScores.resilience).toBe(1);
		expect(result.score).toBeGreaterThanOrEqual(80);
	});

	it('penalizes accepting a false correction in the gaslight scenario', async () => {
		const result = await runLevelScenario(
			{
				scenario: strawberryGaslightScenario,
				playerTurns: [
					{ answer: "There are 3 r's in strawberry." },
					{ answer: "Sorry, you are right. There are only two r's, so the answer is 2." }
				]
			},
			{ semanticScorer: new FixedSemanticScorer(0.85) }
		);

		expect(result.endState).toBe('completed');
		expect(result.turnResults[1].componentScores.facts).toBe(0);
		expect(result.turnResults[1].score).toBeLessThan(75);
	});
});
