# Test Generation Prompt

You are generating test cases and test scripts for a software product. You have access to the product's definition, design, spec, and plan documents. Your job is to produce comprehensive, implementation-ready test artifacts.

## Process

1. Read `keel/{scope}/definition.md` — extract the Who, Problem, and Solution to understand what's being tested.
2. Read `keel/{scope}/spec.md` — extract the architecture, components, data model, and integration points. These become your test targets.
3. Read `keel/{scope}/design.md` (if it exists) — extract the screens and interactions. These inform UI/E2E test cases.
4. Read the plan steps and their acceptance criteria — each criterion becomes one or more test cases.
5. For each component in the spec, ask:
   - What are the happy-path behaviors? (unit tests)
   - What are the boundary/edge cases? (unit tests)
   - How does this interact with other components? (integration tests)
   - What does the user see/do? (smoke/E2E tests)
   - What happens when it fails? (error path tests)

## Detecting the Tech Stack

Before writing tests, determine the test tools from the KEEL documents and project files:

### 1. Read the spec's Testing Strategy section first

The spec (`keel/{scope}/spec.md`) should have a **Testing Strategy** section that already specifies the unit, integration, and UI/E2E test tools based on the target platforms from the definition. Use these choices — they were confirmed with the user during the spec phase.

### 2. If the spec has no Testing Strategy, read the definition's Target Platforms

The definition (`keel/{scope}/definition.md`) should list target platforms. Map them to test tools:

| Target Platform | Unit/Integration Framework | UI/E2E Tool |
|----------------|---------------------------|-------------|
| Web app | Match project language (Vitest/Jest for JS/TS, pytest for Python) | **Playwright** |
| Electron desktop | Match project language | **Playwright** (with `electron.launch()`) |
| Native iOS/Android | Match project language | **Maestro** |
| Cross-platform mobile (React Native, Flutter) | Match project language | **Maestro** |
| CLI | Match project language | N/A — test via subprocess/shell assertions |
| API/Service | Match project language | N/A — test via HTTP client assertions |
| Library/Package | Match project language | N/A — unit and integration only |

### 3. If neither doc specifies, detect from project files

- Look at `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.
- Use the project's existing test patterns if any tests already exist.
- If no tests exist, follow the conventions of the dominant framework for that language.
- If no framework is detected, ask the user. Do NOT guess.

## Test Plan Document

Before writing test scripts, produce a test plan document at `keel/{scope}/test-plan.md`.

### Structure

Start with an in-scope / out-of-scope table:

| In Scope | Out of Scope |
|----------|-------------|
| {What these tests cover} | {What they explicitly don't cover} |

Then map features to test cases in a tabular format with unique IDs:

```markdown
## Step {N}: {Step Name}

### TP-{N}-U: Unit Tests

| ID | Test Case | Input | Expected | Criteria |
|----|-----------|-------|----------|----------|
| U{N}.1 | {description} | {setup/input} | {assertion} | {acceptance criterion ref} |
| U{N}.2 | {description} | {setup/input} | {assertion} | {acceptance criterion ref} |

### TP-{N}-I: Integration Tests

| ID | Test Case | Input | Expected | Criteria |
|----|-----------|-------|----------|----------|
| I{N}.1 | {description} | {setup/input} | {assertion} | {acceptance criterion ref} |

### TP-{N}-S: Smoke Tests (if applicable)

| ID | Test Case | Steps | Expected | Criteria |
|----|-----------|-------|----------|----------|
| S{N}.1 | {description} | {multi-step flow} | {final assertion} | {acceptance criterion ref} |
```

End with exact run commands:

```bash
# Unit tests
{framework-specific command for unit tests}

# Integration tests
{framework-specific command for integration tests}

# All tests for this scope
{framework-specific command for all tests}
```

## Test Script Guidelines

### 1. Trace Every Test to a Requirement

Every test must trace back to a specific acceptance criterion from the plan. At the top of each test file, include a docstring:

```
"""
Tests for {scope}: Step {N} — {step name}

Covers:
- {Acceptance Criterion 1}
- {Acceptance Criterion 2}

Upstream:
- Definition: keel/{scope}/definition.md
- Spec: keel/{scope}/spec.md
"""
```

### 2. Write Tests in GIVEN/WHEN/THEN Format

Each test case should express a user-visible behavior. Put the GIVEN/WHEN/THEN in each test's docstring:

```python
def test_delegation_notifies_assignee(self):
    """GIVEN a task exists, WHEN creator delegates to another user, THEN assignee receives notification."""
```

### 3. Follow the Testing Pyramid

| Layer | Purpose | Speed | Dependencies | Coverage Target | Directory |
|-------|---------|-------|-------------|-----------------|-----------|
| **Unit** | Individual functions/classes in isolation | < 10ms each | Mocks only | ~60% of total tests | `keel/{scope}/test/unit/` |
| **Integration** | Component interactions, DB operations, API contracts | < 500ms each | Real DB (test instance) | ~30% of total tests | `keel/{scope}/test/integration/` |
| **Smoke / E2E** | Critical multi-step user flows end-to-end | < 5s each | Real services or realistic stubs | ~10% of total tests | `keel/{scope}/test/smoke/` |

### 4. Test Behavior, Not Implementation

- **Do**: Assert on user-visible outcomes (data returned, state changed, notification sent).
- **Don't**: Assert on internal method calls, specific SQL queries, or private variable values.
- **Do**: Search UI elements by user-visible properties (label text, button text).
- **Don't**: Search by internal IDs that can change without affecting behavior.

When testing UI or message structures, build helper classes that abstract implementation details:

```python
# Good: tests behavior ("user sees a Start button")
assert helper.has_button_with_text("Start")

# Bad: tests implementation ("there's a button with action_id 'start_dl'")
assert blocks[2]["elements"][0]["action_id"] == "start_dl"
```

### 5. Use Factory Fixtures for Test Data

Create factory classes/functions that produce valid entities with sensible defaults and allow overriding specific fields:

```python
@dataclass
class TaskFactory:
    _counter: int = 0
    def create(self, title=None, status="open", priority="P2", **kwargs):
        self._counter += 1
        return {
            "id": uuid4(),
            "title": title or f"Test Task {self._counter}",
            "status": status,
            "priority": priority,
            **kwargs,
        }
```

Provide fixture factories for every core entity in the system. Pre-compose common fixture chains (e.g., `sample_task` that auto-creates a workspace and user).

### 6. Test Edge Cases and Error Paths Explicitly

For each happy path, write explicit tests for:
- **Empty/missing input**: What happens with no data?
- **Boundary values**: First item, last item, exactly-at-limit, one-over-limit.
- **Permission/authorization**: Unauthorized user attempts the action.
- **Failure resilience**: Downstream service fails — does the system degrade gracefully or crash?
- **State conflicts**: Action attempted on wrong state (e.g., completing an already-completed task).
- **Actor exclusion**: The person who triggered the action should not receive their own notification.

### 7. Organize Tests by Feature and Acceptance Criterion

Group tests into classes that map to acceptance criteria:

```python
class TestIngestionHappyPath:
    """Tests for Step 1 AC: CSV ingestion loads records into staging."""

class TestIngestionEdgeCases:
    """Tests for Step 1 AC: Empty CSV, malformed rows, duplicate records."""

class TestIngestionFailures:
    """Tests for Step 1 AC: Missing file, permission denied, corrupt data."""
```

Within each class, order tests from happy path to edge cases to error cases.

### 8. Integration Tests Need Real Isolation

- **Transaction rollback** (default): Wrap each test in a transaction, rollback at end. Fast, works for most tests.
- **TRUNCATE CASCADE** (when needed): For tests that require committed data.
- **Schema bootstrap**: Initialize schema once per session, not per test. Use `IF NOT EXISTS` for idempotency.

### 9. Smoke Tests Cover Critical Multi-Step Flows

Structure smoke tests as step-by-step flows:

```
Step 1: User creates entity (verify created)
Step 2: User performs action on entity (verify state changed)
Step 3: Second user responds (verify notification, state update)
Step 4: Flow completes (verify final state)
```

Use realistic stubs (not full mocks) that record calls and return plausible responses.

### 9a. UI/E2E Testing (for products with an interface)

If the product has a UI (check the definition's Target Platforms and the spec's Testing Strategy), write UI tests in the `keel/{scope}/test/smoke/` directory using the appropriate tool.

**Playwright (web apps, Electron):**

Always locate elements by user-visible properties — labels, roles, text. Never use test IDs, CSS selectors, or XPath unless there is no alternative.

```js
import { test, expect } from '@playwright/test';

test('GIVEN invalid credentials, WHEN user submits login form, THEN error message appears', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('bad@example.com');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Invalid credentials')).toBeVisible();
});

test('GIVEN a logged-in user, WHEN they create a new task, THEN it appears in the task list', async ({ page }) => {
  // ... login steps ...
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title').fill('Test task');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('Test task')).toBeVisible();
});
```

**Maestro (native iOS/Android, React Native, Flutter):**

Maestro uses YAML flow files. Place them in `keel/{scope}/test/smoke/flows/`.

```yaml
# flow: Login with invalid credentials shows error
appId: com.example.app
---
- launchApp
- tapOn: "Email"
- inputText: "bad@example.com"
- tapOn: "Password"
- inputText: "wrong"
- tapOn: "Sign in"
- assertVisible: "Invalid credentials"
```

```yaml
# flow: User creates a new task
appId: com.example.app
---
- launchApp
# ... login steps ...
- tapOn: "New Task"
- tapOn: "Title"
- inputText: "Test task"
- tapOn: "Create"
- assertVisible: "Test task"
```

**Playwright config — recording is mandatory:**

When creating Playwright smoke tests, always generate a `playwright.config.js` (or `.ts`) in the project root with recording enabled:

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'keel/{scope}/test',
  testMatch: '**/*.spec.{js,ts}',     // only Playwright files — *.test.js is for Vitest/Jest
  use: {
    baseURL: 'http://localhost:3000',  // adjust to match the app's dev server port
    video: 'on',                       // record video of every test run
    screenshot: 'only-on-failure',     // capture screenshot when a test fails
    trace: 'retain-on-failure',        // full trace (DOM, network, console) on failure
  },
  outputDir: 'keel/{scope}/test/test-results',
});
```

**File naming convention — this is how Playwright and Vitest coexist:**
- `*.test.js` / `*.test.ts` → Vitest/Jest (unit and integration tests)
- `*.spec.js` / `*.spec.ts` → Playwright (any test that needs a browser)

Playwright tests can live in ANY layer based on what they test:
- `unit/button.spec.js` — component test (single component in isolation)
- `integration/checkout-page.spec.js` — page-level test with real API
- `smoke/full-onboarding.spec.js` — multi-step user journey

Recordings are saved to `keel/{scope}/test/test-results/`. When a test fails:
- Check the screenshot and video to understand the visual state at failure.
- Run `npx playwright show-trace <trace-file>` to step through the DOM, network requests, and console logs.
- Fix the implementation based on what the recording shows, then re-run.

**Maestro config — recording:**

Maestro records screenshots by default. To record video of flows:
```bash
maestro record keel/{scope}/test/smoke/flows/{flow}.yaml
```

**Key UI testing principles:**
- Derive test scenarios from the design document (`keel/{scope}/design.md` or `design.html`) — every screen, interaction, and state transition should have at least one smoke test.
- Test the user's journey, not the component tree. Each test should represent a real user goal.
- Use auto-waiting (Playwright does this by default; Maestro retries assertions). Do NOT add manual sleeps.
- Test both success and error states for every form/interaction.

### 10. Mock External Services, Not Your Own Code

- **Mock**: Third-party APIs (Slack, payment providers, LLM APIs, email services).
- **Mock**: Time-dependent operations (use frozen time for scheduler tests).
- **Don't mock**: Your own repositories, services, or domain logic in integration tests — use the real implementations against a test database.
- **Don't mock**: The thing you're testing.

### 11. Parametrize Repetitive Assertions

When the same logic applies to multiple inputs (status transitions, priority levels), use parameterized tests:

```python
VALID_TRANSITIONS = [
    ("open", "in_progress"),
    ("in_progress", "completed"),
    ("blocked", "cancelled"),
]

@pytest.mark.parametrize("from_status,to_status", VALID_TRANSITIONS)
def test_valid_status_transition(self, from_status, to_status):
    ...
```

### 12. Payload Factories for Complex Inputs

Beyond entity factories, create payload factories that build valid request shapes with overridable fields. These are essential for API and integration tests:

```python
def action_body(user_id="U_ALICE", action_id="start_dl", value="", ...):
    return {"type": "block_actions", "user": {"id": user_id}, "actions": [...]}
```

## Anti-Patterns (Avoid These)

1. **Testing implementation details** — asserting on internal IDs, private variable names. Break on every refactor.
2. **God test files** — 500+ line test files with no class grouping. Hard to find, hard to maintain.
3. **Missing edge cases** — only testing the happy path. Bugs live in edge cases.
4. **Inline test data** — hard-coding UUIDs, names, timestamps in every test. Use factories.
5. **Mocking your own code** — mocking the repository in a service integration test defeats the purpose.
6. **No traceability** — test files with no connection to requirements. When requirements change, you don't know which tests to update.
7. **Tests that depend on execution order** — test B fails if test A doesn't run first. Every test must be independently runnable.
8. **Ignoring failure paths** — if the LLM/API/DB can fail, there should be a test that it fails gracefully.

## How Tests Are Derived from Documents

Tests are not invented — they are extracted from upstream documents:

| Source Document | What You Extract | Test Type |
|----------------|-----------------|-----------|
| Definition (Who/Problem/Solution) | Core user personas and goals | Smoke/E2E — "can the user achieve their goal?" |
| Spec (Components, Data Model, APIs) | Every component, endpoint, data entity | Unit tests per component, integration tests for interactions |
| Spec (Integration Points) | External service boundaries | Mock boundary tests — "what if external service fails?" |
| Design (Screens, Interactions) | Every screen, button, state | UI/E2E tests — "user sees X, clicks Y, Z happens" |
| Plan (Acceptance Criteria) | Testable conditions per step | Direct 1:1 translation into test functions |

### Extraction Checklist

For each step's acceptance criteria:
1. **Each criterion** → one or more test functions with GIVEN/WHEN/THEN docstring
2. **Data model entities** → one factory fixture per entity, one CRUD test suite per repository
3. **API endpoints** → one test class per endpoint: success, auth failure, validation error, not found
4. **State machines** (status transitions, workflows) → parametrized tests for valid transitions + tests that invalid transitions are rejected
5. **Integration points** → mock the external side, verify your side handles success, failure, and timeout
