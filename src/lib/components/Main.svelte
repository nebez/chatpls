<script lang="ts">
	import { getGameSessionContext } from '$lib/gameplay/session-context';

	const session = getGameSessionContext();
	const mainPanel = session.mainPanel;
</script>

<div>
	<div>Context</div>
	<div>{$mainPanel.systemPrompt}</div>
	<div>User</div>
	<div>{$mainPanel.userPrompt}</div>
</div>
