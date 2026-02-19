import { describe, expect, it } from 'vitest';
import { levelScenarios } from './index';
import { validateScenarioDefinition } from '../validate';

describe('levelScenarios registry', () => {
	it('has unique scenario ids', () => {
		const ids = levelScenarios.map((scenario) => scenario.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('contains only valid scenario definitions', () => {
		for (const scenario of levelScenarios) {
			const errors = validateScenarioDefinition(scenario);
			expect(errors).toEqual([]);
		}
	});

	it('includes at least one branching scenario', () => {
		const hasBranchingScenario = levelScenarios.some((scenario) =>
			scenario.turns.some((turn) => (turn.transitions?.length ?? 0) > 1)
		);

		expect(hasBranchingScenario).toBe(true);
	});
});
