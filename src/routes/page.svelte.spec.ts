import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render landing page links and startup note', async () => {
		render(Page);

		await expect.element(page.getByRole('heading', { name: 'ChatPLS' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Start Chat' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Help' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'About' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'FAQ' })).toBeInTheDocument();
		await expect.element(page.getByText(/network transfer and RAM usage/i)).toBeInTheDocument();
	});
});
