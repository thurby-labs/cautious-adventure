# AI Workflow

`cautious-adventure` uses a small set of AI tools with intentionally different responsibilities.

## Default division of labor

- **ChatGPT:** research, source synthesis, analysis, requirements, and general problem solving.
- **Claude:** substantial coding outside Adobe-specific repository implementation, long-form writing, and presentation work.
- **GitHub Copilot:** implementation inside Adobe projects and GitHub-native repository work.
- **Perplexity Free:** optional rapid source discovery. No workflow requires a paid plan.
- **Adobe Firefly:** optional creative-generation work.

Gemini is not part of the default workflow because there is no distinct required role for it in this repository.

## Adobe project path

```text
Question / idea
      ↓
   ChatGPT
research + requirements + source validation
      ↓
    Claude
architecture + reasoning + implementation approach
      ↓
GitHub Copilot
repository implementation + tests
      ↓
 Human review
      ↓
    GitHub
source of truth
```

## General coding path

```text
Problem
  ↓
ChatGPT (research/specification when needed)
  ↓
Claude (substantial implementation)
  ↓
Copilot (optional repository-aware review/change)
  ↓
Human review
```

## Research path

```text
Question
  ↓
ChatGPT
  ├── Perplexity Free (optional discovery)
  └── primary/authoritative sources
  ↓
research.md
  ↓
Claude (writing/presentation)
  ↓
Human review
```

## Handoff rule

A handoff is useful when the next tool has a different responsibility. It should state the objective, current state, decisions, source material, constraints, open questions, and exact next deliverable.

Do not create handoffs merely to move identical work between tools.
