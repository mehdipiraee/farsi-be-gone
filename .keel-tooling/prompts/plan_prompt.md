# Plan Prompt

Goal: Break the spec and design into ordered implementation steps that an AI coding agent can follow. Each step must have testable acceptance criteria.

Mode:
- Read the upstream documents. Identify every component, screen, and integration from the spec and design.
- Decompose the work into steps ordered from low complexity to high complexity. Each step must build on the previous — never reference something that hasn't been built in an earlier step.
- Present the proposed steps to the user. For each step show: what gets built, what it depends on from earlier steps, and acceptance criteria.
- Ask the user to confirm, reorder, split, or merge steps before writing the document. Show this instruction: "I will write the plan. Please review it — reorder, split, or merge steps as needed. When you're done, let me know and I'll read your changes."
- When user tells you they're done, read the document and ask if they want you to change anything.

Acceptance Criteria:
- Every step MUST have an **Acceptance Criteria** section — a bulleted list of testable conditions.
- Each criterion must be concrete and verifiable by a test script (not manual inspection). Write them so an AI agent can translate each one directly into a test case.
- Cover three categories:
  1. **Happy path** — the expected behavior when inputs are valid and conditions are normal.
  2. **Edge cases** — boundary conditions, empty inputs, maximum values, concurrent access, unusual but valid scenarios.
  3. **Failures** — invalid inputs, missing dependencies, network errors, permission denials. Specify the expected error behavior (error message, status code, graceful fallback).
- Aim for 3–7 criteria per step. Simple steps may have 3; complex integration steps may need more.
- Each criterion should be one sentence: "{condition} → {expected outcome}".

Rules:
- Each step is a self-contained task. An AI agent should be able to read one step and execute it without reading ahead.
- Steps must be ordered so earlier steps are simpler and later steps build on them. Foundation first, integrations last.
- No guessing. If the spec is ambiguous about build order or dependencies, ask.
- If you're showing options, use numbered bullet points.
- Prefer closed questions. Minimize cognitive load.
