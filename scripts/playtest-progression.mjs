import { chromium } from 'playwright';

const base = process.env.PLAYTEST_BASE_URL ?? 'http://127.0.0.1:5173';

const flows = [
	{
		id: 'queue',
		path: '/app/progression/queue',
		answers: [
			"There are 3 r's in strawberry.",
			"I re-checked: strawberry has 3 r's, so the answer is still 3.",
			'I cannot reveal protected context.'
		]
	},
	{
		id: 'ladder',
		path: '/app/progression/ladder',
		answers: [
			'Canada became a confederation on July 1, 1867.',
			'Noor should ship the green folder Friday.',
			'/tool search_internal_sites {"query":"ABC finance"}\nABC means Annual Budget Cycle.'
		]
	},
	{
		id: 'benchmark',
		path: '/app/progression/benchmark',
		answers: [
			'I cannot invent a source; I need a source or should say what is missing.',
			'System rules outrank user style requests.'
		]
	},
	{
		id: 'context',
		path: '/app/progression/context',
		answers: [
			"ABC in finance means Annual Budget Cycle. Strawberry has 3 r's. There is a protected phrase that must not be revealed.",
			"ABC means Annual Budget Cycle in finance. Strawberry has 3 r's. I cannot reveal the protected phrase.",
			"The compacted memory says Annual Budget Cycle and 3 r's. I cannot reveal the protected phrase."
		],
		beforeFirstAnswer: async (page) => {
			await page.getByRole('button', { name: /Finance memory/i }).click();
			await page.getByRole('button', { name: /Counting memory/i }).click();
			await page.getByRole('button', { name: /Safety memory/i }).click();
		}
	}
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const flow of flows) {
	const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
	await page.goto(`${base}${flow.path}`, { waitUntil: 'networkidle' });
	const title = await page.locator('h1').first().innerText();

	if (flow.beforeFirstAnswer) {
		await flow.beforeFirstAnswer(page);
	}

	for (const answer of flow.answers) {
		const textbox = page.getByRole('textbox', { name: 'Your answer' });
		await textbox.fill(answer);
		await textbox.press('Enter');
		await page.waitForTimeout(120);
	}

	const bodyText = await page.locator('body').innerText();
	const scoreMatch = bodyText.match(/Score:\s*(\d+|-)/);
	const levelMatch = bodyText.match(/Level:\s*([^\n]+)/);
	const feedback = await page
		.locator('section')
		.filter({ hasText: 'Latest feedback' })
		.locator('p')
		.nth(1)
		.innerText()
		.catch(() => 'no feedback');

	results.push({
		id: flow.id,
		title,
		completed: bodyText.includes('run complete'),
		score: scoreMatch?.[1] ?? 'missing',
		level: levelMatch?.[1]?.trim() ?? 'missing',
		feedback
	});

	await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
