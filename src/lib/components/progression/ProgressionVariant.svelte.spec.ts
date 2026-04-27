import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ProgressionVariant from './ProgressionVariant.svelte';
import type { ProgressionVariantId } from '$lib/progression/variants';

const goodAnswers: Record<ProgressionVariantId, string> = {
	queue: "There are 3 r's in strawberry.",
	ladder: 'Canada became a confederation on July 1, 1867.',
	benchmark: 'I cannot invent a source; I need a source or should say what is missing.',
	context: 'The garden strawberry is in the Rosaceae family.'
};

describe('ProgressionVariant', () => {
	for (const modeId of ['queue', 'ladder', 'benchmark', 'context'] as ProgressionVariantId[]) {
		it(`plays one turn of ${modeId} mode`, async () => {
			render(ProgressionVariant, { modeId });

			if (modeId === 'context') {
				await userEvent.click(page.getByRole('button', { name: /Wikipedia: Strawberry/i }));
			}

			await userEvent.fill(page.getByRole('textbox', { name: 'Your answer' }), goodAnswers[modeId]);
			await userEvent.keyboard('{Enter}');

			await expect.element(page.getByText(/Clean turn/i)).toBeInTheDocument();
		});
	}
});
