import { env, pipeline } from '@huggingface/transformers';
import type { SemanticSimilarityScorer } from '../types';

export interface HfSemanticScorerOptions {
	modelId?: string;
	allowRemoteModels?: boolean;
	allowLocalModels?: boolean;
	localModelPath?: string;
}

function dot(a: number[], b: number[]): number {
	const length = Math.min(a.length, b.length);
	let total = 0;
	for (let i = 0; i < length; i += 1) {
		total += a[i] * b[i];
	}

	return total;
}

function magnitude(vector: number[]): number {
	return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
	const denom = magnitude(a) * magnitude(b);
	if (denom === 0) {
		return 0;
	}

	return dot(a, b) / denom;
}

async function createExtractor(modelId: string) {
	return pipeline('feature-extraction', modelId);
}

export function createHfSemanticScorer(options: HfSemanticScorerOptions = {}): SemanticSimilarityScorer {
	const modelId = options.modelId ?? 'Xenova/all-MiniLM-L6-v2';

	env.allowRemoteModels = options.allowRemoteModels ?? true;
	env.allowLocalModels = options.allowLocalModels ?? true;

	if (options.localModelPath) {
		env.localModelPath = options.localModelPath;
	}

	let extractorPromise: Promise<Awaited<ReturnType<typeof createExtractor>>> | null = null;

	async function getExtractor() {
		if (!extractorPromise) {
			extractorPromise = createExtractor(modelId);
		}

		return extractorPromise;
	}

	return {
		async similarity(a: string, b: string): Promise<number> {
			const extractor = await getExtractor();
			const aEmbedding = await extractor(a, { pooling: 'mean', normalize: true });
			const bEmbedding = await extractor(b, { pooling: 'mean', normalize: true });

			const aVector = (aEmbedding.tolist() as number[][])[0];
			const bVector = (bEmbedding.tolist() as number[][])[0];
			return cosineSimilarity(aVector, bVector);
		}
	};
}
