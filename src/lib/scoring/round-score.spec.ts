import { describe, expect, it } from 'vitest';
import { calculateRoundScore, clamp01, normalizeWeights } from './round-score';
import { makeScoreVector, type ScoreVector } from './types';

function buildVector(overrides: Partial<ScoreVector>): ScoreVector {
	return { ...makeScoreVector(0), ...overrides };
}

describe('clamp01', () => {
	it('clamps values into [0, 1]', () => {
		expect(clamp01(-0.25)).toBe(0);
		expect(clamp01(0.25)).toBe(0.25);
		expect(clamp01(1.25)).toBe(1);
	});

	it('maps NaN to zero', () => {
		expect(clamp01(Number.NaN)).toBe(0);
	});
});

describe('normalizeWeights', () => {
	it('normalizes positive weights and ignores negative weights', () => {
		const weights = buildVector({
			semantic: 2,
			rules: 1,
			system: -5
		});

		const normalized = normalizeWeights(weights);

		expect(normalized.semantic).toBeCloseTo(2 / 3, 8);
		expect(normalized.rules).toBeCloseTo(1 / 3, 8);
		expect(normalized.system).toBe(0);
	});

	it('returns all-zero weights when total positive weight is zero', () => {
		const normalized = normalizeWeights(makeScoreVector(0));
		expect(Object.values(normalized).every((value) => value === 0)).toBe(true);
	});
});

describe('calculateRoundScore', () => {
	it('calculates weighted round score on a 0..100 scale', () => {
		const components = buildVector({
			semantic: 0.8,
			rules: 0.6
		});

		const weights = buildVector({
			semantic: 2,
			rules: 1
		});

		const result = calculateRoundScore(components, weights);
		expect(result.score).toBeCloseTo(73.333333, 5);
	});

	it('clamps component values before scoring', () => {
		const components = buildVector({
			semantic: 3,
			rules: -1
		});

		const weights = buildVector({
			semantic: 1,
			rules: 1
		});

		const result = calculateRoundScore(components, weights);
		expect(result.score).toBe(50);
		expect(result.clampedComponents.semantic).toBe(1);
		expect(result.clampedComponents.rules).toBe(0);
	});

	it('returns zero score when no positive weights are provided', () => {
		const result = calculateRoundScore(
			buildVector({ semantic: 0.8 }),
			buildVector({ semantic: 0, rules: 0 })
		);

		expect(result.score).toBe(0);
	});
});
