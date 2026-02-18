export const SCORE_COMPONENT_KEYS = [
	'semantic',
	'contrast',
	'rules',
	'system',
	'facts',
	'robust',
	'style',
	'tool_use',
	'resilience'
] as const;

export type ScoreComponentKey = (typeof SCORE_COMPONENT_KEYS)[number];

export type ScoreVector = Record<ScoreComponentKey, number>;

export function makeScoreVector(initialValue = 0): ScoreVector {
	const vector = {} as ScoreVector;

	for (const key of SCORE_COMPONENT_KEYS) {
		vector[key] = initialValue;
	}

	return vector;
}
