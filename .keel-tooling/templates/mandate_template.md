# MANDATE

## About KEEL

This project uses **KEEL (Knowledge Enforced Execution Layer)**. KEEL structures product decisions into a chain of documents — definition, design, spec, plan — that keep AI agents and humans aligned from idea to shipped code.

### Document Chain

```
definition  -->  design  -->  spec  -->  plan  -->  build
 (what/why)     (screens)    (how)     (steps)     (code)
```

Each document builds on the one before it. Changes cascade — updating an upstream document flags inconsistencies in everything downstream.

### How AI Agents Should Use KEEL

1. **Read this mandate first.** Before any work, read `keel/MANDATE.md` to understand the project's identity, constraints, and rules.
2. **Read relevant KEEL documents before writing code.** Check `keel/product/` for product-level context. Check `keel/{capability}/` for the specific area you're working in.
3. **Follow the plan.** If a plan exists for the scope you're working in, follow its steps. Don't skip ahead or improvise architecture that contradicts the spec.
4. **Don't contradict upstream documents.** The definition defines *what* and *why*. The spec defines *how*. Your code should match both. If you think something should change, flag it — don't silently deviate.
5. **Use KEEL skills to make changes.** Run `/keel.update` to change documents — it handles consistency checks and cascading. Don't hand-edit KEEL documents without running the update skill afterward.

### KEEL Skills Reference

| Skill | Purpose |
|-------|---------|
| `/keel.mandate` | Create or update this mandate |
| `/keel.derive` | Analyze existing codebase and generate product docs |
| `/keel.define` | Define a product or capability through interview |
| `/keel.design` | Generate wireframes and interaction design |
| `/keel.spec` | Generate technical architecture and spec |
| `/keel.plan` | Generate ordered build steps |
| `/keel.build` | Execute the plan — write code step by step |
| `/keel.update` | Update any document and cascade changes |

---

## Project Identity

*(What is this project? One paragraph: what it does, who it's for, and why it exists. No implementation details.)*

## Constraints

*(Non-negotiable rules. Technology choices, architectural boundaries, compliance requirements, performance targets, dependencies that must or must not be used. Be specific.)*

## Always Do

*(Rules the AI must always follow when working in this project. Examples: "always write tests for new functions", "always use the project's error handling pattern", "always check for existing utilities before writing new ones".)*

## Never Do

*(Things the AI must never do. Examples: "never use any", "never add dependencies without asking", "never modify migration files directly", "never commit .env files".)*

## Conventions

*(Coding style, naming patterns, file organization, commit message format, PR conventions — anything that keeps the codebase consistent.)*
