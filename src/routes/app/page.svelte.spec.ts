import { page } from 'vitest/browser';
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
});
