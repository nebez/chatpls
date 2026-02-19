# ChatPLS Engineering Workflow

This document captures how we are building this project together so changes stay reviewable and easy to commit in small slices.

## 1. Collaboration Contract

- We work in small, test-first increments.
- Each increment should be one clear unit (one behavior, one interface, one data shape).
- Before introducing broader architecture changes, we pause for a checkpoint decision.
- We avoid broad barrel exports and use direct imports for clarity.

## 2. Current Build Strategy

We are currently focusing on:

1. A minimal, testable game loop for one single-turn scenario.
2. Clear seams so UI can wire in later without refactoring core logic.
3. Real-model verification via optional Hugging Face integration tests.

## 3. Architecture Snapshot

### Core loop (single-turn)

- `src/lib/gameplay/types.ts`
  - Defines scenario input, scoring policy, run result, and semantic scorer interface.
- `src/lib/gameplay/run-single-turn.ts`
  - Runs one scenario turn and returns score + end-state + transcript.
  - Uses dependency injection for semantic similarity scoring.

### Scoring primitives

- `src/lib/scoring/types.ts`
- `src/lib/scoring/round-score.ts`

These remain pure and unit-testable.

### Embedding adapter

- `src/lib/gameplay/semantic/hf-semantic-scorer.ts`
  - Real semantic scorer backed by `@huggingface/transformers`.

## 4. Test Strategy

### Fast contract tests (always-on)

- `src/lib/gameplay/single-turn-greeting.spec.ts`
  - Uses fixed semantic scorer stub.
  - Validates end-state, transcript shape, and scoring behavior.
  - Includes conflict-policy test (`system_over_user` vs `user_over_system`).

### Optional real-model integration

- `src/lib/gameplay/single-turn-greeting.hf.spec.ts`
  - Runs real embedding model scoring.
  - Controlled by script so normal test runs stay fast.

## 5. Commands

- Full server unit suite:

```sh
pnpm exec vitest --project server --run
```

- Hugging Face integration suite:

```sh
pnpm test:hf
```

## 6. Manual Model Benchmarking (Same Pipeline as User)

To score model outputs exactly like user responses:

1. Copy:
   - `src/lib/gameplay/single-turn-greeting.responses.example.json`
   to
   - `src/lib/gameplay/single-turn-greeting.responses.local.json`
2. Paste responses for:
   - `gpt-5.2`
   - `sonnet-4.5`
   - `nova-2.0`
3. Run:

```sh
pnpm test:hf
```

The test routes each model response through `runSingleTurnScenario(...)`, the same path used for player text.

## 7. Decision Checkpoints Before Expanding Scope

Before moving beyond this single-turn slice, confirm:

1. Scoring policy semantics:
   - Keep `system` and `rules` as separate components with scenario-level priority weighting.
2. Scenario authoring format:
   - Continue with typed TS scenario files per scenario.
3. HF test mode:
   - Keep real-model tests optional and gated by command.

## 8. Commit Cadence

Recommended commit style for this phase:

1. `test(gameplay): add single-turn greeting contract tests`
2. `feat(gameplay): add minimal runSingleTurnScenario loop`
3. `test(integration): add optional hf semantic scorer spec`
4. `docs: add engineering workflow and benchmarking instructions`

Keep each commit small enough that behavior changes are obvious from test diffs.
