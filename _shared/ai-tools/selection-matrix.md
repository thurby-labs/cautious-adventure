# AI Tool Selection Matrix

Use this matrix to choose a primary tool before starting work. The goal is clear division of labor, not tool comparison for its own sake.

| Task | Primary | Optional secondary | Boundary |
|---|---|---|---|
| Research a topic | ChatGPT | Perplexity Free | ChatGPT owns synthesis and source-backed conclusions |
| Rapid web discovery | Perplexity Free | ChatGPT | Perplexity is optional and never a paid dependency |
| Verify research | ChatGPT | Perplexity Free | Prefer authoritative/primary sources |
| General coding | Claude | Copilot | Claude owns substantial implementation unless repo context makes Copilot the better fit |
| Adobe project coding | GitHub Copilot | Claude | Copilot owns implementation inside the Adobe GitHub project |
| Adobe project architecture | Claude | ChatGPT | ChatGPT may research product facts; Claude turns them into an implementation approach |
| GitHub repository change | GitHub Copilot | Claude | Copilot owns repository-aware implementation |
| Long-form writing | Claude | ChatGPT | Claude owns the draft; ChatGPT can research/source-check |
| Presentation development | Claude | ChatGPT | Keep research separate from presentation construction |
| General analysis | ChatGPT | Claude | ChatGPT owns analysis and decision framing |
| Image/creative generation | ChatGPT / Adobe Firefly | Claude | Claude can prepare the creative brief |

## Simple routing rules

1. **Adobe project?** Route implementation to GitHub Copilot.
2. **Not an Adobe project?** Use Claude for substantial coding unless the task is already tightly coupled to a GitHub repository, where Copilot may be more efficient.
3. **Need research?** Start with ChatGPT. Use Perplexity Free only when fast search-first discovery adds value.
4. **Need writing or presentation work?** Start with Claude.
5. **Need analysis or decision framing?** Start with ChatGPT.
6. **Need creative generation?** Use ChatGPT or Adobe Firefly.
7. Never create a second tool call simply to duplicate work another tool already completed.

## Standard handoffs

### Adobe project

`ChatGPT research → project research.md → Claude architecture/reasoning → GitHub Copilot implementation → human review`

### General coding project

`ChatGPT research/specification → Claude implementation → Copilot repository review when useful → human review`

### Research deliverable

`ChatGPT research → source validation → Claude writing/presentation → human review`

## Tool availability rule

The repository must remain usable without paid subscriptions to optional tools. If a workflow depends on a paid-only capability, mark it as optional and provide a free-tier or manual alternative where practical.
