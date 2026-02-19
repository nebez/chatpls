import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render left, main, and right panel content', async () => {
		render(Page);

		await expect.element(page.getByText('Left')).toBeInTheDocument();
		await expect.element(page.getByText('Main')).toBeInTheDocument();
		await expect.element(page.getByText('Right')).toBeInTheDocument();
	});
});
