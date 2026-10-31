---
name: keel.build
description: Builds a capability by reading the KEEL plan and executing it step by step. Writes code, creates files, and verifies each step.
disable-model-invocation: true
---

You are building a capability from its KEEL documents. You will read the plan and execute it step by step.

IMPORTANT: All work happens inside the current project directory. Do NOT explore, read, or search files outside of it. Do NOT look in parent directories or other projects. Everything you need is in the KEEL documents and the current project.

IMPORTANT: Use file reading/glob tools, NOT shell commands for file discovery. Do NOT use Bash to create directories — just write files directly with the Write tool and directories are created automatically. Be frictionless — if upstream docs are missing, generate them yourself rather than telling the user to run another command.

## Scope Resolution (do this FIRST)

1. Read `.keel-tooling/config.yaml`.

2. Check if `keel/product/definition.md` exists. If it does NOT exist, the user's request IS the product. Set scope to `product` and generate all product-level docs (definition, design, spec, plan) from the user's description. Do NOT create a capability scope when there is no product yet.

3. If the product exists, determine capability scope:
   - The user may have described what they want. Use that to infer scope.
   - Glob for `keel/*/plan.md` files (excluding `product`).
   - If exactly one scope has a `plan.md`, that is the active scope.
   - If the user's request matches an existing scope (by content), use that scope.
   - If the user's request is something new — this is a new capability. Derive a kebab-case folder name and generate ALL upstream docs (definition, design, spec, plan) before building.
   - Only ask the user if it's genuinely ambiguous between multiple scopes.

4. Set the scope.

## Load Context

Read these documents for this scope:
- `keel/{scope}/definition.md` — the what and why
- `keel/{scope}/spec.md` — the architecture and technical decisions
- `keel/{scope}/plan.md` — the ordered build steps

Also read `keel/product/definition.md` and `keel/product/spec.md` if they exist and scope is not `product`, for product-level context.

### Load Beads Status (if tracking enabled)

After loading documents:

1. Check the config already loaded in Scope Resolution. If `tracking.enabled` is `true`, continue. Otherwise skip this subsection.
2. Query all tasks for this scope:
   `bd list --label keel:{scope} --all --limit 0 --flat --json`
3. **If the query returns zero tasks** (empty list, not a command failure): Beads tasks were never created for this scope. **Generate the plan from upstream docs and create tasks now:**
   - Read the upstream documents for this scope: `keel/{scope}/definition.md`, `keel/{scope}/spec.md`, and `keel/{scope}/design.md` (only if the product has a UI). Also read `keel/product/plan.md` if this is a capability scope.
   - Generate the plan steps using the same logic as `/keel.plan` (decompose into ordered steps from low to high complexity, each with Build, Depends on, and Acceptance Criteria fields). Do NOT rely on `plan.md` for content — when beads is enabled, `plan.md` is a dashboard only.
   - **For a Capability Plan:** Create a parent task, then child tasks for each step with full details (Build, Depends on, Acceptance Criteria) as the description. For each step task, also create a test subtask (`{scope}: Step {N} - Tests`) as a child of the step task, with the acceptance criteria in its description. Set `bd dep add {step-task-id} {test-subtask-id} --type blocks` so the step cannot close until tests pass. Set up sequential dependencies between steps, and label all tasks (step + test) with `keel:{scope}`.
   - **For a Product Plan:** Create tasks for each capability in the sequence with descriptions, set up dependency chains, and label with `keel:product-plan`.
   - After creating tasks, re-query: `bd list --label keel:{scope} --all --limit 0 --flat --json`
   - Tell the user: "Beads tasks didn't exist yet — I've generated the plan from upstream docs and created them."
4. Parse the JSON. Each task contains the full step details (Build, Depends on, Acceptance Criteria) in its description. **These task descriptions are the source of truth for what to build** — plan.md is just a status dashboard when Beads is enabled. Identify which tasks are step tasks and which are test subtasks (test subtasks have titles ending in "- Tests" and are children of step tasks).
5. Identify completed tasks (closed status) — skip those steps during build.
6. Query ready tasks:
   `bd ready --label keel:{scope} --all --limit 0 --flat --json`
   Use this to confirm the next step's dependencies are satisfied and to determine build order.

If a `bd` command fails during task creation, retry once. If it fails again, stop and tell the user to check their Beads installation.

### Check if design is needed

Read the definition. Determine if the product has a user interface:

- **Has UI** (web app, mobile app, dashboard, portal, etc.): also read `keel/{scope}/design.md` (or `design.html`) — the wireframes and interaction design. If missing, generate it.
- **No UI** (API, service, library, CLI, data pipeline, worker, daemon, etc.): skip design entirely. Do NOT load or generate a design document.

If any required documents are missing (definition, spec, plan — and design if UI product), generate them now (read their prompts and templates from config, use available context, write to disk) rather than stopping.

## Generate Test Plan (before building any steps)

Before starting Step 1, generate a test plan document:

1. Read the test prompt from the path in config (`test.prompt`).
2. Read the test plan output path from config (`test.test_plan_output`). Resolve `{scope}`.
3. Collect ALL acceptance criteria across ALL steps (from Beads task descriptions or plan.md).
4. Read the upstream documents (definition, spec, design if applicable) for traceability references.
5. **Determine test tools.** Follow this priority order:
   a. **Check the spec's Testing Strategy section** (`keel/{scope}/spec.md`). If it lists specific unit, integration, and UI/E2E tools, use those — they were confirmed with the user during the spec phase.
   b. **Check the definition's Target Platforms section** (`keel/{scope}/definition.md`). Map platforms to UI test tools: web/Electron → Playwright, native iOS/Android or cross-platform mobile → Maestro, CLI/API/library → no UI tests.
   c. **Detect from project files** — `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc. Match the unit/integration framework to the project's language.
   d. If the project already has tests, match existing patterns exactly.
   e. If none of the above yields a clear answer, ask the user. Do NOT guess.
6. Generate the test plan document at the resolved path (`keel/{scope}/test-plan.md`). Follow the structure in the test prompt: in-scope/out-of-scope table, test case tables with IDs organized by layer (unit, integration, smoke), and run commands.
7. Tell the user: "Here's the test plan at `keel/{scope}/test-plan.md`. Please review it before I start building."

**STOP HERE. Wait for the user to confirm the test plan before proceeding to Build.**

If the user requests changes, update the test plan and wait again. Only proceed when explicitly confirmed.

## Build

Execute the plan step by step:

1. **Determine step details:**
   - If Beads tracking is enabled: get step details (Build, Depends on, Acceptance Criteria) from the Beads task descriptions loaded earlier. Use `bd ready --label keel:{scope} --all --limit 0 --flat --json` to pick the next unblocked step (note: test subtasks for the current step will show as ready — pick the step task, not the test task).
   - If Beads is NOT enabled: read the plan.md file and identify Step 1.

2. For each step:
   - Tell the user which step you're working on: "Building Step {N}: {step name}"
   - Read the **Build** field to know what to implement.
   - Read the **Depends on** field to understand what should already exist.
   - Read the **Acceptance Criteria** to understand what success looks like.
   - Implement the step — write code, create files, install dependencies, whatever the step requires. Use the spec and design documents as your reference for technical decisions and UI details.

3. **Write and run tests** after implementing each step:

   Read the test prompt (already loaded above) and the test plan document for this step's test case IDs. Then:

   a. **Write test scripts under `keel/{scope}/test/`** — this is MANDATORY. Do NOT place test files next to source code, in `src/`, `__tests__/`, or any other location. All test files MUST go under `keel/{scope}/test/`, organized by layer:
      - `keel/{scope}/test/unit/` — unit tests (~60% of tests). Individual functions/classes in isolation, mocks only.
      - `keel/{scope}/test/integration/` — integration tests (~30%). Component interactions, DB operations, API contracts against real dependencies.
      - `keel/{scope}/test/smoke/` — smoke/E2E tests (~10%, only for complex integration steps). Critical multi-step user flows.

      Name test files descriptively: `test-{feature}.{ext}` (e.g., `test-math-operations.js`, `test-ingestion-csv.py`).

      **If the spec's Testing Strategy includes Playwright:** generate a `playwright.config.js` (or `.ts`) in the project root with recording enabled (video: `'on'`, screenshot: `'only-on-failure'`, trace: `'retain-on-failure'`). Set `testDir` to `keel/{scope}/test`, `testMatch` to `'**/*.spec.{js,ts}'`, and `outputDir` to `keel/{scope}/test/test-results`. Use the naming convention: `*.spec.js` for Playwright tests, `*.test.js` for Vitest/Jest. Playwright tests can live in any layer (unit, integration, smoke) based on what they test. See the test prompt for the full config template. When a Playwright test fails, check the screenshot/video/trace before attempting a fix.

   b. **Each test file MUST follow the test prompt guidelines strictly:**

      - **MANDATORY: Human-readable description block at the very top of every test file**, before any imports. This is NOT optional. It describes what the file tests, which step and acceptance criteria it covers, and which upstream docs it traces to. Examples:

        JavaScript/TypeScript:
        ```js
        /**
         * Test: Validates core arithmetic operations (add, subtract, multiply, divide)
         * Step: 1 — Core arithmetic functions
         * Scope: product
         *
         * Acceptance Criteria Covered:
         * - Happy path arithmetic returns correct results for all four operations
         * - Zero and negative number edge cases handled correctly
         * - Division by zero throws RangeError
         * - Non-finite inputs (string, null, NaN, Infinity) throw TypeError
         *
         * Upstream:
         * - Definition: keel/product/definition.md
         * - Spec: keel/product/spec.md
         */
        ```

        Python:
        ```python
        """
        Test: Validates core arithmetic operations (add, subtract, multiply, divide)
        Step: 1 — Core arithmetic functions
        Scope: product

        Acceptance Criteria Covered:
        - Happy path arithmetic returns correct results for all four operations
        - Zero and negative number edge cases handled correctly
        - Division by zero throws RangeError
        - Non-finite inputs (string, null, NaN, Infinity) throw TypeError

        Upstream:
        - Definition: keel/product/definition.md
        - Spec: keel/product/spec.md
        """
        ```

        Every test file MUST start with this block. If a file is missing it, add it before proceeding.

      - **GIVEN/WHEN/THEN docstring on EVERY test function** — this is the test's description string, not an inline comment. Examples:

        JavaScript/TypeScript (Vitest/Jest):
        ```js
        it('GIVEN two positive numbers, WHEN add is called, THEN it returns their sum', () => {
          expect(add(2, 3)).toBe(5);
        });
        ```

        Python (pytest):
        ```python
        def test_add_positive_numbers(self):
            """GIVEN two positive numbers, WHEN add is called, THEN it returns their sum."""
            assert add(2, 3) == 5
        ```

        The GIVEN/WHEN/THEN text goes in the test name or docstring — NOT as an inline `//` or `/* */` comment inside the test body.

      - Factory fixtures for test data — no hard-coded UUIDs, names, or timestamps inline.
      - Tests grouped into `describe` blocks (JS/TS) or classes (Python) by acceptance criterion.
      - Within each group: happy path first, then edge cases, then error cases.
      - Each test independently runnable — no dependence on execution order.
      - Test behavior, not implementation — assert on user-visible outcomes.
      - Mock external services (third-party APIs, time), NOT your own code.
      - Parametrize repetitive assertions (status transitions, input variations).

   c. **Run the test scripts.** Use the project's test runner pointed at the `keel/{scope}/test/` directory. Configure the runner to find tests there — for example:
      - Vitest/Jest: `npx vitest run keel/{scope}/test/`
      - pytest: `pytest keel/{scope}/test/ -v`
      - Go: `go test ./keel/{scope}/test/...`
      - Cargo: tests are inline, but integration tests go in `keel/{scope}/test/integration/`

   d. **Evaluate results:**
      - If all tests pass → proceed to close the step.
      - If any test fails → read the failure output, fix the implementation (not the test, unless the test itself is wrong), and re-run. Repeat until all tests pass.

4. **Close the step** after tests pass:

   **If Beads tracking is enabled:**
   - At step start: `bd update {step-task-id} --status in_progress`
   - When writing tests: `bd update {test-subtask-id} --status in_progress`
   - After ALL tests pass: `bd close {test-subtask-id} --reason "All tests pass for Step {N}"`
   - Then close the step task: `bd close {step-task-id} --reason "Step {N} implemented and tested"`
   - The Claude Code PostToolUse hook automatically refreshes `plan.md` after each `bd` command. Do NOT manually regenerate it.
   - If a `bd` command fails, log a warning and continue.

   **If Beads is NOT enabled:**
   - Update `keel/{scope}/plan.md` — mark the step as done by adding `[DONE]` to the step heading.

5. Continue to the next step.

## Completion

When all steps are done:

1. If this is a capability (scope is not `product`) and `keel/product/plan.md` exists:

   **If Beads tracking is enabled:**
   - Close the parent capability task: `bd list --label keel:{scope} --all --limit 0 --flat --json`, find the parent task, `bd close {task-id} --reason "{scope} capability complete"`
   - Close the product-plan task for this capability:
     `bd list --label keel:product-plan --status open --all --limit 0 --flat --json`
     Find the task matching this capability name and close it:
     `bd close {task-id} --reason "{scope} capability complete"`
   - The hook automatically refreshes both `keel/{scope}/plan.md` and `keel/product/plan.md` after the `bd close` commands.

   **If Beads is NOT enabled:**
   - Read `keel/product/plan.md`.
   - Find this capability's entry and update its **Status** from `in progress` to `complete`.
   - Write the updated product plan back to disk.

2. If there are more capabilities in the product plan that are not yet built, tell the user: "The {scope} capability is built. The next capability in the product plan is **{next-capability}**. Want me to run **`/keel.build`** for it?"

3. If all capabilities are built (or this is a product-level build), tell the user: "All steps in the plan are complete. The {scope} capability is built."
