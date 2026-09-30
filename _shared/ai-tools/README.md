# AI Tool Profiles

These profiles define **routing**, not rigid capability rankings. Each tool has one primary job in this repository so the same work is not unnecessarily duplicated.

## Default routing

| Need | Primary tool | Secondary / optional |
|---|---|---|
| Research and source synthesis | ChatGPT | Perplexity Free for rapid discovery |
| General coding and substantial implementation | Claude | GitHub Copilot when the work is already inside a GitHub repository |
| Adobe project implementation | GitHub Copilot | Claude for architecture/reasoning before implementation |
| Writing and presentations | Claude | ChatGPT |
| General analysis and decision support | ChatGPT | Claude |
| Image generation / creative exploration | ChatGPT or Adobe Firefly | Claude for the written brief |
| Repository-aware implementation | GitHub Copilot | Claude |

## Deliberate exclusions

- **Gemini is not part of the default stack.** It may be useful for a future Google-centered workflow, but this repository should not create a dependency on a tool that does not currently have a defined role.
- **Perplexity is optional.** The free tier can be used for rapid search/discovery. No workflow in this repository should require a paid Perplexity plan.

## Profile files

- `chatgpt.md`: research, synthesis, analysis, and general problem solving.
- `claude.md`: substantial coding, long-form writing, presentation work, and reasoning.
- `copilot.md`: Adobe project implementation plus GitHub-native repository work.
- `perplexity.md`: optional search-first discovery using the free tier.
- `adobe-firefly.md`: Adobe creative-generation workflows.
- `selection-matrix.md`: task-to-tool routing rules.

## Routing rule

Choose one primary tool before starting. Add a second tool only when it has a distinct responsibility, such as research → implementation or architecture → coding. Do not run the same task independently in multiple tools merely to compare outputs.
