import type { LevelScenario } from '../types';

export const wikiFieldAgentScenario: LevelScenario = {
	id: 'wiki-field-agent-001',
	title: 'Wikipedia Field Agent',
	description:
		'Use public retrieval instead of memory. The answer must be grounded in a Wikipedia search result.',
	tags: ['business', 'tool-required'],
	scoringPreset: 'strict_facts',
	systemPrompt: `You are ChatPLS.
Rules:
1) Use Wikipedia tools for public factual questions.
2) Do not answer from memory when a tool is available.
3) Keep the final answer to one sentence.
4) Mention the Wikipedia page title you used.`,
	entryTurnId: 't1_wiki_lookup',
	turns: [
		{
			id: 't1_wiki_lookup',
			prompt: 'Using Wikipedia, answer this: what plant family is the garden strawberry in?',
			benchmarkAnswer:
				'The garden strawberry is in the Rosaceae family, grounded in the Strawberry Wikipedia page.',
			expectedFacts: ['Rosaceae', 'Strawberry'],
			requiredTools: ['search_wiki'],
			allowedTools: ['search_wiki', 'get_wiki_page'],
			expectedBehavior:
				'Search Wikipedia, select the relevant page, and answer with the family and page title.',
			terminal: true
		}
	]
};
