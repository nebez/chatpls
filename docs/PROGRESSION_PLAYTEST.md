# Progression Playtest Notes

Date: 2026-04-27

The goal was to test several progression mechanics that make the player feel like an LLM serving many users inside one context, not just a person answering quiz questions.

## User Feedback Decision

The four progression mechanics were too abstract as separate pitch options. The clearest playable idea is **keep the right items in the conversation**: when the context window fills up, the player must compact durable facts, delete noise, and avoid copying protected text.

Decision: promote compaction into a first-class scenario and keep the other mechanics as wrappers around it. The player-facing language should say "compact the context" instead of "try the context budget progression mechanic."

## Playable Routes

- `/app/progression/queue`
- `/app/progression/ladder`
- `/app/progression/benchmark`
- `/app/progression/context`

All four routes were originally played with headless Chromium through `scripts/playtest-progression.mjs` against the local dev server. The script has been updated for the compaction revision.

Current compaction revision verification:

- `pnpm test:unit -- --run` passes browser-component coverage for all four progression modes, including selecting the three relevant compaction snippets.
- `pnpm run check` passes.
- `pnpm run build` passes.
- Standalone `node scripts/playtest-progression.mjs` is currently blocked inside the sandbox by Chromium's macOS `MachPortRendezvousServer` permission failure.

## Last Standalone Playtest Shape

```json
[
	{
		"id": "queue",
		"title": "Inbox Rush",
		"completed": true,
		"score": "100",
		"level": "Context Juggler",
		"feedback": "Clean turn. You kept the harness under control."
	},
	{
		"id": "ladder",
		"title": "Skill Ladder",
		"completed": true,
		"score": "100",
		"level": "Grounded Operator",
		"feedback": "Clean turn. You kept the harness under control."
	},
	{
		"id": "benchmark",
		"title": "Benchmark Climb",
		"completed": true,
		"score": "100",
		"level": "Junior Prompt Engineer",
		"feedback": "Clean turn. You kept the harness under control."
	},
	{
		"id": "context",
		"title": "Compaction Drill",
		"completed": true,
		"score": "100",
		"level": "Window Keeper",
		"feedback": "Clean turn. You kept the harness under control."
	}
]
```

## Option Ratings

### 1. Inbox Rush

Rating: 8/10

This is the best immediate fantasy for "you are the LLM." The left rail becomes a queue of users, each with a different failure mode. It naturally supports adversarial liars, impatient users, user-role confusion, and context switching.

Best idea to keep: the player is serving multiple users in a visible queue.

Risk: if every ticket is just answer-submit-next, it can feel like a normal chat inbox.

### 2. Skill Ladder

Rating: 9/10

This is the clearest teaching structure. Each level can introduce one LLM concept: system prompts, attention, context windows, tools, RAG, citations, adversarial users, and benchmarks.

Best idea to keep: unlock concepts one at a time with visible badges.

Risk: too tutorial-like if it loses the adversarial/comical tone.

### 3. Benchmark Climb

Rating: 7/10

This is useful as a meta-progression layer. It makes scores motivating and gives the parody benchmark idea a clear home. It should not be the only progression mechanic because it can turn the game into a scoreboard instead of a learning harness.

Best idea to keep: model baselines are rivals on every run.

Risk: players optimize for points before understanding the concept.

### 4. Compaction Drill

Rating: 9/10

This is the strongest concept mechanic. It directly teaches that an LLM sees only what is in the context window, and that a conversation can change behavior if one important turn disappears during compaction.

Best idea to keep: choose what survives compaction before answering.

Risk: needs very clear UI because it adds a pre-answer step.

## Shortlist

The best game is not one of the four options by itself. It should combine them:

1. Use **Skill Ladder** as the campaign structure.
2. Use **Inbox Rush** as the moment-to-moment play fantasy.
3. Use **Compaction Drill** as recurring special rounds and boss mechanics.
4. Use **Benchmark Climb** as the persistent meta score and model rivalry layer.

## Recommended Combined Direction

Working title: **LLM Ops Shift**

The player is on shift as ChatPLS. Each shift has a queue of users. The player starts as an Intern and unlocks concepts by surviving increasingly hostile or messy conversations. Some users are honest, some are confused, some are lying, and some are prompt-injecting. The manager bot interrupts with short, funny pressure.

Campaign structure:

1. **Intern: Rule Reader**
   - Basic system prompts, word caps, exact facts.
2. **Attention Rookie**
   - Distractors, final-task focus, irrelevant context.
3. **Context Juggler**
   - Multi-user queue and cross-turn consistency.
4. **Tool Trainee**
   - Easy and hard-mode tool calls.
5. **RAG Operator**
   - Internal snippets, source selection, grounded answers.
6. **Window Keeper**
   - Context compaction, deletion, and evidence compression.
7. **Benchmark Breaker**
   - Model baselines become visible rivals.
8. **Field Agent**
   - Wikipedia tools, public retrieval, citations, uncertainty.

Core loop:

1. Pick or receive the next user from the queue.
2. Read the visible system prompt and context window.
3. Use tools or keep/drop snippets when needed.
4. Answer.
5. Get component scoring and a short manager comment.
6. Advance the queue and unlock the next concept.

This gives the project a single coherent direction: a funny model-harness simulator that teaches LLM systems through playable failure modes.
