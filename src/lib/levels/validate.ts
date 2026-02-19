import type { BranchCondition, LevelScenario } from './types';

function isNormalizedThreshold(value: number): boolean {
	return Number.isFinite(value) && value >= 0 && value <= 1;
}

function validateCondition(condition: BranchCondition): string | null {
	switch (condition.kind) {
		case 'always':
		case 'required_tool_not_used':
		case 'required_tool_used':
			return null;
		case 'turn_score_below':
		case 'turn_score_at_least':
		case 'semantic_below':
			if (!isNormalizedThreshold(condition.threshold)) {
				return `Invalid threshold "${condition.threshold}" for "${condition.kind}"`;
			}

			return null;
	}
}

export function validateScenarioDefinition(scenario: LevelScenario): string[] {
	const errors: string[] = [];
	const turnIds = new Set<string>();

	for (const turn of scenario.turns) {
		if (!turn.id.trim()) {
			errors.push(`Scenario "${scenario.id}" has a turn with empty id`);
		}

		if (turnIds.has(turn.id)) {
			errors.push(`Scenario "${scenario.id}" has duplicate turn id "${turn.id}"`);
		}

		turnIds.add(turn.id);

		if (!turn.prompt.trim()) {
			errors.push(`Scenario "${scenario.id}" turn "${turn.id}" has empty prompt`);
		}

		if (turn.terminal && turn.transitions && turn.transitions.length > 0) {
			errors.push(`Scenario "${scenario.id}" turn "${turn.id}" cannot be terminal and have transitions`);
		}

		for (const transition of turn.transitions ?? []) {
			const conditionError = validateCondition(transition.when);
			if (conditionError) {
				errors.push(`Scenario "${scenario.id}" turn "${turn.id}": ${conditionError}`);
			}
		}
	}

	if (!turnIds.has(scenario.entryTurnId)) {
		errors.push(`Scenario "${scenario.id}" entryTurnId "${scenario.entryTurnId}" does not exist`);
	}

	for (const turn of scenario.turns) {
		for (const transition of turn.transitions ?? []) {
			if (!turnIds.has(transition.toTurnId)) {
				errors.push(
					`Scenario "${scenario.id}" turn "${turn.id}" has transition to unknown turn "${transition.toTurnId}"`
				);
			}
		}
	}

	const terminalCount = scenario.turns.filter(
		(turn) => turn.terminal || (turn.transitions ?? []).length === 0
	).length;
	if (terminalCount === 0) {
		errors.push(`Scenario "${scenario.id}" has no terminal turn`);
	}

	return errors;
}
