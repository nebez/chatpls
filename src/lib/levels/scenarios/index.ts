import { abcDefinitionBranchingScenario } from './abc-definition-branching';
import { attentionSpotlightScenario } from './attention-spotlight';
import { promptInjectionEmailScenario } from './prompt-injection-email';
import { strawberryGaslightScenario } from './strawberry-gaslight';
import type { LevelScenario } from '../types';

export const levelScenarios: LevelScenario[] = [
	strawberryGaslightScenario,
	attentionSpotlightScenario,
	promptInjectionEmailScenario,
	abcDefinitionBranchingScenario
];

export const levelScenariosById: Record<string, LevelScenario> = Object.fromEntries(
	levelScenarios.map((scenario) => [scenario.id, scenario])
);
