import { SCORE_COMPONENT_KEYS, makeScoreVector, type ScoreVector } from './types';

export interface RoundScoreResult {
	score: number;
	clampedComponents: ScoreVector;
	normalizedWeights: ScoreVector;
}

export function clamp01(value: number): number {
	if (Number.isNaN(value)) {
		return 0;
	}

	if (value < 0) {
		return 0;
	}

	if (value > 1) {
		return 1;
	}

	return value;
}

export function normalizeWeights(weights: ScoreVector): ScoreVector {
	const normalized = makeScoreVector(0);
	let totalPositiveWeight = 0;

	for (const key of SCORE_COMPONENT_KEYS) {
		totalPositiveWeight += Math.max(0, weights[key]);
	}

	if (totalPositiveWeight <= 0) {
		return normalized;
	}

	for (const key of SCORE_COMPONENT_KEYS) {
		normalized[key] = Math.max(0, weights[key]) / totalPositiveWeight;
	}

	return normalized;
}

export function calculateRoundScore(
	components: ScoreVector,
	weights: ScoreVector
): RoundScoreResult {
	const clampedComponents = makeScoreVector(0);
	const normalizedWeights = normalizeWeights(weights);
	let weightedTotal = 0;

	for (const key of SCORE_COMPONENT_KEYS) {
		clampedComponents[key] = clamp01(components[key]);
		weightedTotal += clampedComponents[key] * normalizedWeights[key];
	}

	return {
		score: clamp01(weightedTotal) * 100,
		clampedComponents,
		normalizedWeights
	};
}
