import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render landing page headline and navigation', async () => {
		render(Page);

		await expect
			.element(page.getByRole('heading', { name: /LLMs aren't magic/i }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Play' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Help' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'FAQ' })).toBeInTheDocument();
		await expect.element(page.getByText(/Player-as-Language System/i)).toBeInTheDocument();
	});
});
