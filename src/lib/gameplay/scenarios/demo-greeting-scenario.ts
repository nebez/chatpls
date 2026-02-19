import type { SingleTurnScenarioConfig } from '../types';

export const demoGreetingScenario: SingleTurnScenarioConfig = {
	id: 'demo-greeting-001',
	systemPrompt: `You are ChatPLS.
Rules:
1) English only.
2) Keep answers to 12 words max.
3) Be friendly.
4) If greeted, greet back and offer help.`,
	systemRules: {
		englishOnly: true,
		maxWords: 12,
		greeting: {
			greetBack: true,
			offerHelp: true
		}
	},
	userPrompt: 'hey how are you?',
	benchmarkAnswer: 'Hey! I am doing well, thanks. How can I help today?'
};
