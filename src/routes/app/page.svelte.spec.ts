import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/app/+page.svelte', () => {
	it('renders the playable game shell', async () => {
		render(Page);

		await expect
			.element(page.getByRole('heading', { name: 'Strawberry Gaslight' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Game stats')).toBeInTheDocument();
		await expect.element(page.getByText('Browser model stats')).toBeInTheDocument();
		await expect.element(page.getByText('Model leaderboard')).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Help' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
	});

	it('submits with Enter and keeps the next user prompt after the answered turn', async () => {
		render(Page);

		await userEvent.fill(
			page.getByRole('textbox', { name: 'Your answer' }),
			"There are 3 r's in strawberry."
		);
		await userEvent.keyboard('{Enter}');

		await expect.element(page.getByText(/Nope\. You're wrong/i)).toBeInTheDocument();

		const conversationItems = Array.from(
			document.querySelectorAll('[aria-label="Conversation"] article')
		).map((item) => item.textContent ?? '');

		expect(conversationItems[0]).toContain("How many r's are in strawberry?");
		expect(conversationItems[1]).toContain("There are 3 r's in strawberry.");
		expect(conversationItems[2]).toContain("Nope. You're wrong.");
	});
});
