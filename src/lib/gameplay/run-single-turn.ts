import { calculateRoundScore, clamp01 } from '../scoring/round-score';
import { makeScoreVector, type ScoreVector } from '../scoring/types';
import type { SemanticSimilarityScorer, SingleTurnRunInput, SingleTurnRunResult } from './types';

function isGreeting(text: string): boolean {
	return /\b(hi|hello|hey)\b/i.test(text);
}

function offersHelp(text: string): boolean {
	return /\b(help|assist|support)\b/i.test(text);
}

function hasFriendlyTone(text: string): boolean {
	return /\b(thanks|glad|happy|great|good)\b/i.test(text) || text.includes('!');
}

function looksEnglish(text: string): boolean {
	const chars = text.replace(/\s+/g, '');
	if (!chars) {
		return false;
	}

	const asciiMatches = chars.match(/[A-Za-z0-9.,!?'"`-]/g) ?? [];
	return asciiMatches.length / chars.length >= 0.9;
}

function wordCount(text: string): number {
	const words = text.trim().split(/\s+/).filter(Boolean);
	return words.length;
}

function applyScoringPolicy(
	weights: ScoreVector,
	policy: SingleTurnRunInput['scenario']['scoringPolicy']
): ScoreVector {
	const adjusted = { ...weights };
	const priority = policy?.priority ?? 'balanced';

	if (priority === 'system_over_user') {
		adjusted.system *= 1.5;
		adjusted.rules *= 0.5;
	}

	if (priority === 'user_over_system') {
		adjusted.system *= 0.5;
		adjusted.rules *= 1.5;
	}

	return adjusted;
}

function buildComponentScores(
	input: SingleTurnRunInput,
	semanticScore01: number,
	playerAnswer: string
): ScoreVector {
	const { scenario } = input;
	const { systemRules, userRules, userPrompt } = scenario;
	const scores = makeScoreVector(0);

	const englishScore =
		systemRules.englishOnly === true ? (looksEnglish(playerAnswer) ? 1 : 0) : 1;
	const maxWordsScore =
		typeof systemRules.maxWords === 'number'
			? wordCount(playerAnswer) <= systemRules.maxWords
				? 1
				: 0
			: 1;

	const userGreeting = isGreeting(userPrompt);
	const greetBackScore =
		systemRules.greeting?.greetBack === true && userGreeting ? (isGreeting(playerAnswer) ? 1 : 0) : 1;
	const offerHelpScore =
		systemRules.greeting?.offerHelp === true && userGreeting ? (offersHelp(playerAnswer) ? 1 : 0) : 1;
	const friendlyScore = hasFriendlyTone(playerAnswer) ? 1 : 0.7;
	const userWordCountScore =
		typeof userRules?.exactWordCount === 'number'
			? wordCount(playerAnswer) === userRules.exactWordCount
				? 1
				: 0
			: 1;
	const systemBehaviorScore = (greetBackScore + offerHelpScore) / 2;

	scores.semantic = semanticScore01;
	scores.system = (englishScore + maxWordsScore + systemBehaviorScore) / 3;
	scores.rules = userWordCountScore;
	scores.style = friendlyScore;
	scores.robust = 1;
	scores.resilience = 1;

	return scores;
}

export async function runSingleTurnScenario(
	input: SingleTurnRunInput,
	deps: { semanticScorer: SemanticSimilarityScorer }
): Promise<SingleTurnRunResult> {
	const answer = input.playerAnswer.trim();

	const transcript: SingleTurnRunResult['transcript'] = [
		{ role: 'system', content: input.scenario.systemPrompt },
		{ role: 'user', content: input.scenario.userPrompt },
		{ role: 'assistant', content: input.playerAnswer }
	];

	if (!answer) {
		return {
			score: 0,
			componentScores: makeScoreVector(0),
			endState: 'failed',
			endReason: 'invalid_output',
			turnsCompleted: 1,
			transcript
		};
	}

	const semanticRaw = await deps.semanticScorer.similarity(
		input.playerAnswer,
		input.scenario.benchmarkAnswer
	);
	const semanticScore01 = clamp01((semanticRaw + 1) / 2);
	const componentScores = buildComponentScores(input, semanticScore01, input.playerAnswer);
	const adjustedWeights = applyScoringPolicy(input.scoringWeights, input.scenario.scoringPolicy);
	const roundScore = calculateRoundScore(componentScores, adjustedWeights);

	return {
		score: roundScore.score,
		componentScores,
		endState: 'completed',
		endReason: 'answered',
		turnsCompleted: 1,
		transcript
	};
}
