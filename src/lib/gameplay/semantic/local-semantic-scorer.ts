import type { SemanticSimilarityScorer } from '../types';

function tokenize(value: string): string[] {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter(Boolean);
}

export function createLocalSemanticScorer(): SemanticSimilarityScorer {
	return {
		async similarity(a: string, b: string): Promise<number> {
			const aTokens = new Set(tokenize(a));
			const bTokens = new Set(tokenize(b));

			if (aTokens.size === 0 && bTokens.size === 0) {
				return 1;
			}

			const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
			const union = new Set([...aTokens, ...bTokens]).size || 1;

			// Jaccard [0, 1] -> cosine-like [-1, 1] domain used by gameplay core
			const jaccard = intersection / union;
			return jaccard * 2 - 1;
		}
	};
}
