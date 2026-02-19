import { abcDefinitionBranchingScenario } from './abc-definition-branching';
import type { LevelScenario } from '../types';

export const levelScenarios: LevelScenario[] = [abcDefinitionBranchingScenario];

export const levelScenariosById: Record<string, LevelScenario> = Object.fromEntries(
	levelScenarios.map((scenario) => [scenario.id, scenario])
);
