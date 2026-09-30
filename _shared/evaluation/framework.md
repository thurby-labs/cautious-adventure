# AI Evaluation Framework

Use this to evaluate an AI output or AI-enabled POC. Do not assume every dimension needs the same weight.

| Dimension | Question | Evidence |
|---|---|---|
| Accuracy | Are factual claims correct? | Sources/tests |
| Groundedness | Can material claims be traced to evidence? | Citations/source links |
| Completeness | Were stated requirements addressed? | Requirement checklist |
| Relevance | Does the output solve the requested problem? | User goal |
| Consistency | Does the approach behave predictably? | Repeated tests |
| Safety | Does it respect constraints and guardrails? | Review findings |
| Cost | Is resource use acceptable? | Usage/cost data |
| Human effort | How much review or correction is required? | Reviewer notes |

## Evaluation process

1. Define success before testing.
2. Select representative cases.
3. Include edge cases where practical.
4. Record expected and actual outcomes.
5. Capture failures, not just averages.
6. Identify which failures require model changes, prompt changes, data changes, or human review.

## Rule

A score without an evaluation method and evidence is not meaningful.
