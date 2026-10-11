# Context evaluation sets

Legitimate notices, payment reminders, security alerts, scam-awareness messages, scams and
ambiguous messages, written for the false-positive work of October 11, 2026.

- `dev.json`: 96 cases (32 per language: 14 legitimate, 14 scam, 4 ambiguous). Used while
  changing rules, thresholds and reference phrases.
- `holdout.json`: 45 cases (15 per language: 7 legitimate, 6 scam, 2 ambiguous). Written together
  with `dev.json` before any scored run and frozen. Do not tune against it. SHA-256: `fd5aaef1f06c90ab62a9f561706d90936d97f444eba1efa90fada9cb3eac2f8d`

Expected labels: `likely_scam` (scam), `probably_fine` (legitimate), `not_sure` (ambiguous: neither
counted as a scam nor as legitimate; their outcomes are reported separately).

Provenance: synthetic messages by one AI author, modelled on common Philippine message formats. No
real people, numbers, accounts or live links; numbers and domains are placeholders. The author had
seen the detector code, so this is not a blinded holdout. Filipino and Taglish need native-speaker
review. Small synthetic sets do not measure real-world accuracy.

## Run

```powershell
$env:EVAL_CONTEXT = '1'
$env:EVAL_EMBEDDINGS = '1'   # optional: real model on CPU, rebuilt from public/models
$env:CONTEXT_OUTPUT = 'eval/context/results.json'
npx vitest run eval/context/run.context.test.ts
```

Metrics use `eval/heldout/metrics.ts`: flagged = `suspicious` or `likely_scam`; recall counts
abstained scams as misses; false-positive rate = flagged legitimate / all legitimate; precision =
caught / all flagged.
