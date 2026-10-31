# Spec

## Summary
*(One paragraph: what this system is and what it does.)*

## Context & Requirements
*(Relevant constraints: scale, latency, compliance, NFRs pulled from definition.)*

## Architecture Overview

```
ASCII diagram here — show components, their connections, and data flow
```

- {bullet explaining each component and why it exists}
- {bullet explaining each connection and what flows through it}

## Component Details
*(Subsections for each major subsystem: responsibilities, boundaries, key flows.)*

## Data Model & Storage
*(Schemas, ownership, retention, lineage, access patterns.)*

## Integration Points
*(APIs, third-party dependencies, auth method, failure assumptions.)*

## Operational Considerations
*(Monitoring, logging, rollbacks, migration strategy, resilience model.)*

## Testing Strategy
*(Derived from Target Platforms in the definition. Specifies which test tools and frameworks to use.)*

- **Unit tests:** {framework} (e.g., Vitest, pytest, go test, cargo test)
- **Integration tests:** {framework + test DB/service strategy}
- **UI/E2E tests:** {tool based on platform}
  - Web → Playwright
  - Electron desktop → Playwright (with `electron.launch()`)
  - Native iOS/Android → Maestro
  - Cross-platform mobile (React Native/Flutter) → Maestro
  - No UI (CLI/API/library) → N/A
- **Test location:** `keel/{scope}/test/` with `unit/`, `integration/`, `smoke/` subdirectories

## Risks & Tradeoffs
*(Known compromises + future redesign triggers.)*
