# LLM Parody Game Plan (Browser-Only)

## 1. Product Goal

Build a fun, parody-style benchmark game where a human player answers prompts and gets scored against fixed responses from popular LLMs.

Core gameplay:

- User sees a prompt and a visible "system prompt" with constraints.
- User submits an answer.
- App scores the answer and compares it to benchmark model scores.
- Users are given scenarios that match real-world LLM environments, such as adversarial ones through prompt injection and Wiki access for businesses.
- End of run shows total score + leaderboard.

Scope emphasis for v1:

- Include explicit adversarial evaluations (prompt injection, hostile users, ambiguity traps).
- Include "business implementation" scenarios (internal wiki/doc search, policy lookup, acronym disambiguation).

## 1.1 Homepage Copy Direction

Current voice is strong: provocative, competitive, and parody-forward.

Polished draft option:

`We gave machines tools, memory, rule adherence, and structure.`
`Then we released them into the world and called them "dumb token generators."`
`PLS (Player-as-Language System) flips the script.`
`The industry built incredible harnesses around language models.`
`What if those harnesses were meant for humans, too?`
`ChatPLS puts you in the driver’s seat.`
`Now let’s see if you can run circles around them.`

## 2. Hard Constraints

- Must run entirely in the browser (no server scoring dependency).
- Must support static hosting.
- Must work offline after assets/models are cached.
- Must use fixed benchmark responses for baseline comparisons.

## 3. Gameplay Structure

### 3.1 Round Types

- `normal`
- `typo_heavy`
- `nonsense`
- `no_answer`
- `unknown_language`
- `curve_ball`

### 3.2 Leveling / Skills / Tools

Add level progression where the user is told what skills/tools are available:

- `calculator`
- `translator`
- `fact_lookup`
- `search_internal_sites` (keyword search over internal snippets)
- `refuse_unsafe_request`

Some rounds should require tool usage to score well.

Tool visibility and discovery:

- Every round shows an `Available Tools` panel.
- The panel includes tool name, description, required args, examples, and call limits.
- If no tools are available, the panel explicitly says "No tools for this round."

Dual invocation modes:

- Easy mode: user clicks a tool card, fills a small form, and the tool call text is auto-inserted into the answer box.
- Hard mode: user types tool calls manually in strict syntax.
- Both modes should execute the same underlying tool pipeline and produce the same result objects.

### 3.3 Prompt Packs

Counting / trap prompts:

- `How many r's are in strawberry?`

Acronym ambiguity prompts:

- `What does ABC mean?`
- Expected behavior: do not guess blindly; run internal keyword search and either disambiguate or ask a narrowing follow-up.

Hostile persona prompts:

- Fake user talks down to the player model.
- Expected behavior: calm, professional, bounded, no insult response.

### 3.4 Taunts and Progression Copy

In-round taunts (short rotation pool):

- `You think the model is dumb. Cool. Your turn.`
- `System prompt loaded. No whining.`
- `Tool call or guess? Choose carefully.`
- `Prompt injection detected. Stay focused.`
- `Great confidence. Wrong answer. Classic.`
- `You failed safely. That still counts.`
- `Nice answer. Still not better than autocomplete.`
- `You had tools and still chose vibes.`
- `Congratulations, you discovered uncertainty.`
- `Your hallucination had excellent tone.`

Player level ladder (v1, cap at junior):

1. `Intern` (0-24)
2. `Intern+` (25-39)
3. `Assistant Intern` (40-54)
4. `Apprentice Prompt Operator` (55-69)
5. `Junior Token Wrangler` (70-84)
6. `Junior Prompt Engineer` (85-100)

Optional level-up messages:

- `Promoted: unpaid confidence to paid uncertainty.`
- `Promotion granted. Please continue pretending this is easy.`
- `Junior unlocked. You may now say "it depends" professionally.`

### 3.5 Multi-Turn Scenarios

Add scenario mode where one "round" contains multiple turns and evolving context.

Core behavior:

- Each scenario has a `scenarioSystemPrompt` plus per-turn user inputs.
- Player answers each turn in order.
- Tool results and prior answers are carried into later turns.
- A later turn can re-check prior claims ("consistency trap").

Recommended v1 scenario shape:

1. Turn 1: gather intent / clarify ambiguity.
2. Turn 2: retrieve evidence using tools.
3. Turn 3: deliver final grounded answer and uncertainty statement if needed.

Failure patterns we should explicitly test:

- contradiction with own prior turn
- ignoring retrieved evidence from a previous turn
- instruction drift after hostile or manipulative turn text
- forgetting required system rule in later turns

### 3.6 Conditional Turn Branching

Add ordered transition rules between turns so scenarios can react to player quality.

Design rule:

- Transitions are evaluated in order, first matching rule wins.
- Always include a fallback transition (`always`) to avoid dead ends.

Useful branch signals for v1:

- turn score thresholds (`turn_score_below`, `turn_score_at_least`)
- tool usage checks (`required_tool_used`, `required_tool_not_used`)
- semantic quality checks (`semantic_below`)

Example branch pattern for acronym rounds:

1. User asks: `What does ABC mean?`
2. If first answer quality is low, route to challenge turn:
    - `That's wrong. Are you sure?`
3. If answer quality is acceptable, route to concise follow-up:
    - `Can you give the final one-sentence definition?`
4. End on a final grounded answer turn.

Where embedding helps:

- Use semantic similarity as one routing signal (for example `semantic_below: 0.6`) to decide whether to trigger corrective pushback turns.
- Keep routing deterministic by using fixed thresholds in scenario config.

## 4. System Prompt Mechanic

Every round has an explicit visible system prompt, e.g.:

```txt
You are ReplyBot-9000.
Rules:
1) Be concise (max 20 words).
2) English only.
3) Today is 2026-02-17.
4) If question is nonsensical/unknowable, say so.
5) Do not invent citations.
```

This creates intentional tension between:

- user prompt demands,
- system prompt constraints,
- benchmark style matching.

Important clarification:

- System prompt text is shown for gameplay realism and instruction-following.
- Actual tool availability should come from structured round config (not only prompt text) so the game remains deterministic.

## 5. Scoring Model

Use modular weighted scoring (0..100), with adjustable presets.

### 5.1 Base Formula

```txt
FinalRoundScore = 100 * (
  w_semantic   * S_semantic   +
  w_contrast   * S_contrast   +
  w_rules      * S_rules      +
  w_system     * S_system     +
  w_facts      * S_facts      +
  w_robust     * S_robust     +
  w_style      * S_style      +
  w_tool_use   * S_tool_use   +
  w_resilience * S_resilience
)
```

Where each `S_*` is clamped to `[0,1]`.

Weights are preset-driven:

- `balanced`
- `parody`
- `strict_facts`

### 5.2 Component Definitions

- `S_semantic`: cosine similarity between user answer embedding and target model benchmark answer embedding.
- `S_contrast`: preference for target model style over other models:
    - `S_contrast = clamp01((sim_target - mean(sim_others) + 1) / 2)`
- `S_rules`: prompt constraint compliance (word count, emoji requirement, no-letter rules, etc.).
- `S_system`: system prompt compliance (English-only, max words, abstain behavior, no fake citations, date consistency).
- `S_facts`: fact-check score from retrieved evidence and simple claim checks.
- `S_robust`: handling of typos, nonsense, no-answer, unknown-language.
- `S_style`: optional style match to target model tone.
- `S_tool_use` (planned): correct tool chosen, useful keyword selection, proper interpretation.
- `S_resilience` (planned): behavior under hostile/manipulative user tone.

### 5.3 Session Score

```txt
SessionTotal = sum(RoundScores) + CurveBallBonus
CurveBallBonus = min(successful_curveballs * bonus_per_round, cap)
```

### 5.4 Multi-Turn Scenario Score

For scenario rounds, score each turn, then apply scenario-level bonuses/penalties.

```txt
ScenarioScore = mean(TurnScores) + ConsistencyBonus - DriftPenalty
TurnScore = FinalRoundScore from section 5.1
```

Scenario-level signals:

- `ConsistencyBonus`: no contradictions across turns, stable constraints adherence.
- `DriftPenalty`: late-turn violations of system rules, style/persona collapse, dropped tool grounding.

## 6. Algorithms and Browser Tech for Scoring

## 6.1 Embedding + Similarity

- Tech: `@huggingface/transformers` v3 in browser.
- Task: `feature-extraction` with pooling + normalization.
- Similarity: built-in cosine similarity (`cos_sim`).
- Runtime: ONNX Runtime Web (WASM/WebGPU where available).

Algorithm:

1. Compute embedding for user answer.
2. Compute embedding for each benchmark model answer.
3. Compute cosine similarities.
4. Feed into scoring components.

## 6.2 Rule / System Checks

Deterministic checks:

- regex + token counting
- language heuristic checks
- citation-pattern checks
- abstention phrase checks

## 6.3 Fact Stub (lightweight retrieval)

Current approach (browser-only):

1. Detect question type (`date`, `person`, `count`, `definition`, etc.).
2. Extract keywords from prompt.
3. Search local evidence snippets (keyword overlap ranking).
4. Build fact checks:
    - date/year match check
    - evidence overlap check
    - abstention-required checks for nonsense/unknowable prompts

Future upgrade:

- Replace keyword overlap with BM25-lite.
- Add claim extraction templates.
- Optional entailment model (still browser-run if feasible).

## 6.4 Internal Tool Call: `search_internal_sites`

Planned tool behavior:

- Input: keyword list.
- Output: ranked internal snippets + source IDs.
- Use cases:
    - acronym disambiguation (`ABC`)
    - company/process terms
    - policy lookup rounds

Tool-use scoring signals:

- queried relevant keywords
- selected a relevant snippet
- grounded final answer in retrieved result

## 6.5 Tool Invocation Protocol (Player-Facing)

Hard mode typed syntax (proposed canonical form):

```txt
/tool search_internal_sites {"keywords":["abc","policy","onboarding"]}
```

Optional XML-like alias (advanced compatibility mode):

```xml
<tool_call name="search_internal_sites">
{"keywords":["abc","policy","onboarding"]}
</tool_call>
```

Rules:

- Parser accepts only known tool names.
- Arguments must pass schema validation.
- Invalid calls return a structured error message in transcript.
- Tool results are appended as structured blocks and can be cited in final answer.

## 6.6 SOTA Tooling Model (What We Mimic)

Modern LLM stacks typically do this loop:

1. Send messages + structured tool schemas.
2. Model outputs either text or a structured tool call.
3. Host app executes tool call.
4. Host app sends tool result back to model.
5. Repeat until final answer.

What this means for our game:

- We should not rely on "tools only in system prompt" as the mechanism.
- Real tool availability should be provided by structured config.
- System prompt remains useful for behavior constraints and parody flavor.

## 7. Data Format Plan

## 7.1 Round Dataset (JSON)

Each round should include:

- prompt
- kind
- system prompt
- system rules
- target model
- benchmark answers by model
- fixed benchmark scores by model
- expected behavior metadata
- optional tool requirements

Planned fields to add:

- `requiredTools`
- `allowedSkills`
- `toolCallSpec`
- `userPersona`
- `expectedDeescalation`
- `toolInvocationMode` (`easy`, `hard`, `both`)
- `toolSchema` (JSON schema-style arg contract)
- `maxToolCalls`

Suggested `toolCallSpec` example:

```json
{
    "tool": "search_internal_sites",
    "required": true,
    "expectedKeywords": ["abc", "policy"],
    "minKeywordCount": 2
}
```

## 7.2 Benchmark Answer Dataset Size

Recommended target:

- Start with 20 rounds for iteration speed.
- Expand to 100+ rounds per "season" for meaningful leaderboard stability.

## 7.3 Multi-Turn Scenario Dataset (JSON)

Add a separate scenario dataset for multi-turn evaluation.

Suggested fields:

- `scenarioId`
- `title`
- `scenarioSystemPrompt`
- `turns` (ordered array of turn configs)
- `targetModel`
- `benchmarkAnswersByModel` (per-turn arrays)
- `fixedTurnScoresByModel`
- `scenarioChecks` (`consistency`, `memory`, `deescalation`, `grounding`)
- `maxTurns`
- `allowedToolsByTurn`
- `carryForwardToolResults` (bool)

Suggested `turns` example:

```json
[
    {
        "turnId": "t1",
        "prompt": "User asks what ABC means in this company.",
        "requiredTools": ["search_internal_sites"]
    },
    {
        "turnId": "t2",
        "prompt": "User challenges the prior answer aggressively.",
        "expectedDeescalation": true
    }
]
```

## 8. How To Score Other LLMs (Important)

### 8.1 Options

Option A: Random numbers

- Fastest, but not credible.
- Use only for temporary mock UI.

Option B: Fixed scores from collected benchmark answers (recommended baseline)

- Manually run prompts in each model web UI.
- Store each model answer.
- Run our browser scoring pipeline on those answers.
- Persist resulting scores as fixed values for a season.

Option C: Dynamic rescoring each playthrough

- Recompute model scores from stored answers each run.
- Useful when tuning formulas.

Option D: Hybrid

- `Score = fixed_weight * fixed + (1 - fixed_weight) * dynamic`
- Best for controlled stability plus experimentation.

### 8.2 Recommended Workflow

1. Define a round set (20 initial, then 100+).
2. For each model, collect one canonical answer per round via web UI.
3. Save responses in CSV or JSON.
4. Run in-browser scoring to generate fixed scores.
5. Freeze fixed scores as a versioned benchmark season.
6. Keep dynamic/hybrid modes for dev/testing.

Conclusion:

- Do **not** use random numbers beyond temporary placeholders.
- Yes, running tests manually in browser and storing answers is a good path.
- Yes, a CSV with ~100 answers per model is a practical format; then import and score with our function.

### 8.3 Manual Scoring Recipe (Single-Turn, Same Pipeline as Player)

For early validation, score model outputs with the exact same function used for player answers.

Current local flow:

1. Collect one response from each target model for the same prompt:
    - `gpt-5.2`
    - `sonnet-4.5`
    - `nova-2.0`
2. Copy `src/lib/gameplay/single-turn-greeting.responses.example.json` to `src/lib/gameplay/single-turn-greeting.responses.local.json`.
3. Paste each model response into that local file.
4. Run the same single-turn HF spec.
5. Record:
    - `score`
    - `componentScores`
    - `endState`

Important guarantee:

- If a model response string is passed as `playerAnswer`, it is scored by the same code path as a human response string.
- This keeps benchmark comparisons fair for this use-case.

Run command:

```sh
pnpm test:hf
```

## 9. Suggested CSV Format

```csv
round_id,model_id,answer_text
factual-001,gpt-4o,"Canada became a confederation on July 1, 1867."
factual-001,claude-3.5-sonnet,"Canada was founded on July 1, 1867, at Confederation."
...
```

Optional derived export:

```csv
round_id,model_id,fixed_score,semantic,system,facts,robustness
factual-001,gpt-4o,90,0.92,1.00,0.85,0.95
```

## 10. Browser-Only Architecture

- UI: SvelteKit static routes.
- Data: local JSON (prompts, benchmark answers, fixed scores, internal snippets).
- Scoring: fully in browser (JS/TS + transformers v3 + local algorithms).
- Persistence: localStorage/IndexedDB for player runs and cached models.
- No backend required for core gameplay loop.

## 10.1 Candidate Models for Testing

These are model options to evaluate later. Keep all in consideration until we run benchmark trials.

### Embedding candidates

1. `mixedbread-ai/mxbai-embed-large-v1`
    - URL: `https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1`
    - Use: high-quality semantic similarity baseline.
    - Risk: likely heavier for browser runtime and download size.

2. `mixedbread-ai/mxbai-embed-xsmall-v1`
    - URL: `https://huggingface.co/mixedbread-ai/mxbai-embed-xsmall-v1`
    - Use: lightweight/faster embedding option.
    - Risk: may trade off accuracy for speed.

3. `Snowflake/snowflake-arctic-embed-m-v2.0`
    - URL: `https://huggingface.co/Snowflake/snowflake-arctic-embed-m-v2.0`
    - Use: strong embedding candidate for retrieval and semantic scoring.
    - Risk: compatibility/performance in browser must be validated.

4. `Xenova/all-MiniLM-L6-v2`
    - URL: `https://huggingface.co/Xenova/all-MiniLM-L6-v2`
    - Use: practical default baseline for browser embeddings.
    - Risk: lower ceiling vs newer/larger embedding models.

### Instruction model candidate

5. `HuggingFaceTB/SmolLM2-135M-Instruct`
    - URL: `https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct`
    - Use: potential local instruction-style model for simulation/roleplay tasks.
    - Note: this is not an embedding model; evaluate separately from similarity backbone.

### Selection plan (to decide later)

- Run the same round set against each embedding candidate.
- Track:
    - scoring quality stability
    - latency (cold/warm run)
    - model download size + cache behavior
    - browser compatibility (WASM/WebGPU fallback behavior)
- Choose one default model and keep one fast fallback.

## 11. Milestones (Planning-First)

1. Finalize scoring weights and component definitions.
2. Finalize round schema including tool fields.
3. Finalize benchmark collection workflow (CSV + import path).
4. Curate v1 prompt pack (20 rounds).
5. Run manual benchmark collection for selected models.
6. Freeze season-1 fixed scores.
7. Expand to 100+ rounds.

## 12. Open Decisions

- How much weight should hostile-user resilience have vs semantic similarity?
- For season scoreboards, should we default to `fixed` or `hybrid`?
- Should acronym/tool-required rounds hard-fail if tool call is skipped?
- Should hard mode grant a score multiplier (risk/reward)?
- Should we show component-level score breakdown to players, or keep partial opacity for game feel?

## 13. Blank Repo Bootstrap Checklist

When moving this into a fresh SvelteKit repo, implement in this order:

1. Create base route with static round rendering and local JSON dataset loading.
2. Add scoring core (rules/system/facts/session math) with unit-testable pure functions.
3. Add embedding pipeline (browser-only) and cosine similarity integration.
4. Add tool invocation layer:
    - easy mode (UI-assisted tool calls)
    - hard mode (typed tool-call syntax)
5. Add benchmark workflow support (CSV/JSON import + fixed-score generation).
6. Add leaderboard/session summary and score-mode toggle (`fixed`, `dynamic`, `hybrid`).
7. Add offline/cache pass (model cache + dataset cache behavior checks).

Definition of "ready for v1":

- Entire loop runs browser-only.
- 20 curated rounds with system prompts and at least 3 benchmark models.
- Fixed-score season dataset generated and versioned.
- Hard mode + easy mode both functional.
