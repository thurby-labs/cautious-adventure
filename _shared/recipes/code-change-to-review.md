# Recipe: Code Change → Review

Use this when an implementation needs a clean review path.

## Adobe project

1. Capture requirements in the project artifacts.
2. Research product facts with ChatGPT when needed.
3. Use Claude for architecture or implementation reasoning when the change is substantial.
4. Use GitHub Copilot to implement the approved change inside the Adobe repository.
5. Run tests and repository checks.
6. Use the review checklist.
7. Human reviews behavior, assumptions, security, and acceptance criteria.

## Non-Adobe project

1. Define requirements.
2. Use Claude for substantial implementation.
3. Use GitHub Copilot only when repository-aware editing or review provides a distinct benefit.
4. Run tests and review.

## Do not

- Have Claude and Copilot independently implement the same change.
- Treat AI output as approved without testing.
- Put secrets, PII, or proprietary customer information into this public repository.
