import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render session-driven panel content', async () => {
		render(Page);

		await expect.element(page.getByText('Metadata')).toBeInTheDocument();
		await expect.element(page.getByText('Context')).toBeInTheDocument();
		await expect.element(page.getByText('Stats')).toBeInTheDocument();
	});
});
