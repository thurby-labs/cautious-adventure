# GitHub Copilot Profile

**Primary role in `cautious-adventure`:** implementation partner for Adobe projects and GitHub-native repository work.

## Use Copilot for

- Implementing changes in Adobe projects stored in GitHub.
- Working directly against repository files, instructions, tests, and Git history.
- Turning an approved architecture or requirements artifact into code/configuration.
- Repository-aware refactoring.
- Test creation and test-driven fixes.
- Reviewing a proposed repository change when the review depends on repository context.

## Do not default to Copilot for

- Open-ended research.
- Initial architecture exploration.
- Long-form business writing.
- General brainstorming.
- Repeating an implementation that Claude has already completed without a specific review or repository reason.

## Adobe project workflow

For an Adobe project, the preferred sequence is:

1. **ChatGPT:** research, source validation, requirements, and factual synthesis.
2. **Claude:** architecture, implementation approach, reasoning, or substantial design work when needed.
3. **GitHub Copilot:** implement the approved change inside the repository, add/update tests, and work through repository-specific instructions.
4. **Human:** review the resulting behavior, assumptions, security, and acceptance criteria.
5. **GitHub:** retain the reviewed repository state as the source of truth.

The tools have different jobs. Do not ask all three to independently solve the same problem.

## Repository instructions

Read these before making changes:

- `/AI.md`
- `/AGENTS.md`
- `/.github/copilot-instructions.md`
- The nearest path-specific `.github/instructions/*.instructions.md` file.
- The project's `context.md`, `requirements.md`, and `decisions.md` when present.

## Working rules

- Ask before resolving ambiguous requirements.
- Preserve existing project structure unless there is a documented reason to change it.
- Prefer small, reviewable changes.
- Follow conventional commits.
- Run relevant tests/checks before declaring work complete.
- Never add secrets, PII, proprietary customer information, private communications, or confidential Adobe project material to this public repository.
- Explain non-obvious implementation choices in the project documentation when they matter to future work.

## GitHub sources

- GitHub Copilot custom instructions: https://docs.github.com/en/copilot/concepts/prompting/response-customization
- GitHub Copilot cloud agent project guidance: https://docs.github.com/en/copilot/tutorials/cloud-agent/improve-a-project
