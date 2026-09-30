# cautious-adventure

A public Git-based source of truth for AI-assisted proof of concepts, personal productivity, and reusable knowledge resources.

## Core principle

GitHub holds the durable knowledge and project state. AI tools consume, reason over, transform, and contribute back to that source of truth.

## Default AI stack

- **ChatGPT:** research, source synthesis, analysis, and requirements.
- **Claude:** substantial coding outside Adobe-specific implementation, writing, and presentations.
- **GitHub Copilot:** Adobe project implementation and GitHub-native repository work.
- **Perplexity Free:** optional rapid source discovery. No paid plan required by this repository.
- **Adobe Firefly:** optional creative generation.

Gemini is intentionally not part of the core stack because it currently has no distinct required role here.

See [`docs/AI-COMMAND-CENTER.md`](docs/AI-COMMAND-CENTER.md) for the front door to the workflows.

## Public-repository boundary

Do not commit sensitive customer or personal information, proprietary customer code, private communications, secrets, financial/account information, home address information, or confidential project details.

When in doubt, stop and ask.

## Structure

```text
_shared/    shared instructions, prompts, skills, recipes, templates, evaluation, security, and AI-tool routing
personal/   public-safe personal POCs, notes, samples, and productivity resources
adobe/      public-safe Adobe knowledge, projects, consulting methods, prompts, and templates
docs/       repository guidance, workflow documentation, sources, and learning
tools/      utility documentation and future automation helpers
```

## Project statuses

`idea` · `active` · `paused` · `complete` · `archived`

## First project

`adobe/projects/adobe-genai-study-guide/`

## Working rules

1. Read the nearest applicable instructions before changing files.
2. Ask before resolving ambiguous requirements.
3. Prefer existing structures over creating new ones.
4. Preserve source provenance.
5. Explain non-obvious decisions.
6. Keep AI work human-reviewed where judgment matters.
