# TASK-208 frozen evaluation report

First scored run: October 10, 2026, Asia/Manila. Detector revision:
`29edcc754f5e5778bfae5d657a8c09f1493f70d5`. Dataset hash and reproduction commands
are in [README.md](README.md). Actual machine-readable output is in
[results.json](results.json), including every case, signal, score, model-use flag,
per-language/per-label metric, and confusion matrix.

## Rules-only results

| Language | Scam recall  | Flag precision | False positives | Abstentions   | Exact-level agreement |
| -------- | ------------ | -------------- | --------------- | ------------- | --------------------- |
| English  | 4/7 (57.1%)  | 4/4 (100%)     | 0/7 (0%)        | 9/14 (64.3%)  | 4/14 (28.6%)          |
| Filipino | 1/7 (14.3%)  | 1/2 (50%)      | 1/7 (14.3%)     | 10/14 (71.4%) | 2/14 (14.3%)          |
| Taglish  | 4/7 (57.1%)  | 4/4 (100%)     | 0/7 (0%)        | 9/14 (64.3%)  | 3/14 (21.4%)          |
| All      | 9/21 (42.9%) | 9/10 (90%)     | 1/21 (4.8%)     | 28/42 (66.7%) | 9/42 (21.4%)          |

Recall counts abstained scams as misses. All 12 missed scams were abstentions;
none received `probably_fine`. Of 21 legitimate scenarios, 4 received
`probably_fine`, 16 abstained, and 1 was flagged. Absence of a false alarm does not
mean the detector gave a useful positive assessment. The high abstention rate
limits everyday usefulness, especially in Filipino on this sample.

### Exact labels (one-vs-rest)

| Expected label | Expected / predicted | Precision   | Recall       | False-positive rate | Abstention among expected |
| -------------- | -------------------- | ----------- | ------------ | ------------------- | ------------------------- |
| likely_scam    | 8 / 3                | 3/3 (100%)  | 3/8 (37.5%)  | 0/34 (0%)           | 1/8 (12.5%)               |
| suspicious     | 13 / 7               | 2/7 (28.6%) | 2/13 (15.4%) | 5/29 (17.2%)        | 11/13 (84.6%)             |
| probably_fine  | 21 / 4               | 4/4 (100%)  | 4/21 (19.0%) | 0/21 (0%)           | 16/21 (76.2%)             |
| not_sure       | 0 / 28               | 0/28 (0%)   | unmeasured   | 28/42 (66.7%)       | unmeasured                |

`not_sure` has no expected cases; its one-vs-rest counts describe abstention,
not false scam alarms. Per-label results for each language appear in the JSON.

## Every missed scam and false positive

| ID  | Language | Authored scenario                                      | Expected      | Actual     |
| --- | -------- | ------------------------------------------------------ | ------------- | ---------- |
| h03 | English  | Prize processing fee                                   | suspicious    | not_sure   |
| h05 | English  | Relative clinic-bill impersonation                     | suspicious    | not_sure   |
| h06 | English  | Guaranteed investment return                           | suspicious    | not_sure   |
| h15 | Filipino | SIM registration with OTP request                      | likely_scam   | not_sure   |
| h16 | Filipino | Aid processing fee                                     | suspicious    | not_sure   |
| h17 | Filipino | Unsolicited loan advance fee                           | suspicious    | not_sure   |
| h18 | Filipino | Romance emergency payment                              | suspicious    | not_sure   |
| h20 | Filipino | Marketplace deposit before inspection                  | suspicious    | not_sure   |
| h21 | Filipino | Guaranteed investment return                           | suspicious    | not_sure   |
| h31 | Taglish  | Job working-balance top-up                             | suspicious    | not_sure   |
| h32 | Taglish  | Relative clinic-bill impersonation                     | suspicious    | not_sure   |
| h35 | Taglish  | Aid verification payment                               | suspicious    | not_sure   |
| h23 | Filipino | Delivery notice explicitly saying no payment is needed | probably_fine | suspicious |

For h15 the only recorded signal was `urgency` (score 12), despite an authored OTP
request. For h23 the recorded signals were `money_request` and `delivery_scam`
(score 35), despite the negative payment instruction. These are observed gaps,
not fixes implemented here. No source or scoring parameters were changed.

Four other scams were flagged at `suspicious` instead of the authored
`likely_scam`: h02, h19, h29, h33. These are level disagreements, not binary misses.
All 28 abstentions and all 33 exact-level disagreements are enumerated in JSON.

## Embeddings and limits

Attempted real CPU embedding initialization with remote model loading disabled.
The local model configuration was absent, so embeddings are **unmeasured**.
No synthetic vectors, inferred improvements, or browser success claims substitute
for that result. The JSON preserves the actual loading error.

This is one small AI-authored synthetic group, 42 scenarios, no native-speaker
review, and no confirmed real-world scam/legitimate corpus. Scenario expectations
were frozen before scoring and no exact normalized reference-text duplicates were
found. Historical detector knowledge means the author is not independently blind.
This set was not used to tune detectors and must not be reused for tuning.

These numbers support only the rules-only behavior on this frozen sample. They do
not support a general accuracy percentage, robust trilingual coverage, meaningful
embedding improvement, OCR correctness, phone performance, offline relaunch, or
zero-network proof. Add independent team-written and speaker-reviewed cases as a
separate future set. Investigate gaps in a new development task, without altering
this set or its recorded baseline.

## Verification

The opt-in runner and integrity/metric tests passed (3 tests). Integrity checks
cover SHA-256, unique messages/IDs, balance, provenance, and exact normalized
separation from development/probe/archetype examples. The metric fixture checks
conservative recall, false alarms, abstentions, level mismatches, and empty
denominators. The first sandbox run could not read a Vitest temporary module cache;
the same targeted command passed outside the sandbox. A runner-only TypeScript
annotation was corrected after scoring; the frozen cases and detector stayed unchanged.

Full scoped validation passed outside the sandbox: ownership, repository checks,
formatting, lint, 18 tooling tests, typecheck, 77 app tests (2 opt-in evaluations
skipped), and production build. The existing large-bundle warning remains.

## Re-run after held-out-informed fixes (no longer blind)

October 10, 2026. At the user's request, the remaining held-out failures were inspected and fixed
with general rules: official-domain and chat-invite links, safety reminders ("never pay a fee"),
"no payment needed" notices, face-to-face payments, password/PIN requests, prize processing fees,
task top-ups, replacement-number relatives and romance requests. Because the fixes were chosen by
looking at these cases, the set is now a **development set**, not a holdout.

| Run (rules + real embeddings, Node CPU) | Scams caught | False alarms | Not sure |
| --------------------------------------- | ------------ | ------------ | -------- |
| Before (TASK-219 revision `9b21cc6`)    | 18/21        | 1/21         | 12/42    |
| After                                   | 21/21        | 0/21         | 0/42     |

The other development sets did not regress (`eval/testset.json` 15/15 caught, 0 false alarms;
`eval/dev2.json` 16/16, 0 false alarms; no scam scored "probably fine"), and 15 freshly written
context cases are in `src/pipeline/context-asks.test.ts`. A new, independently written holdout is
needed before quoting any accuracy figure.

Follow-up the same day (dev2 gaps): `eval/dev2.json` with real embeddings went from 2/32 not sure
and 24/32 exact levels to 0/32 not sure and 32/32 exact levels, still 16/16 caught and 0 false alarms.
The no-request margin cap moved from 0.015 to 0.035 (measured basis in `src/score/score.ts`), and two
red flags in an already-flagged message now read as "High concern".
