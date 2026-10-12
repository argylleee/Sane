# Generalization challenge set

Independent messages for each failure pattern behind the October 12, 2026 reports. No message
reuses the reported names, sentences or amounts.

- Unseen Filipino/Taglish payment-request forms (`pakihulugan`, `pa-cash in`, `gcash-an`,
  `pautangin`, `i-transfer`, amounts in words).
- Amount formats and Unicode obfuscation, alone and combined.
- Scam contexts: tickets, reservations, prizes, rigged raffles, gift cards, and impersonation by
  celebrities, their management or assistants, fan-page admins, organizers, employers, banks,
  agencies and relatives.
- Benign lookalikes that mention people, events, prizes or money but ask for nothing risky.

Files:

- `dev.json`: 45 cases (15 per language). May guide implementation. SHA-256 at creation:
  `14bf2e96ae5896661f7b65454d6b8fbd92b0f7f0a2812705ce924eb4e78639ec`
- `holdout.json`: 45 cases (15 per language), written together with `dev.json` before any scored
  run, with different payment forms, senders and wording. Never used to tune. SHA-256: `f4e967d7ee00044dc34a196b545ddf1bf71ac0f66efe9a57052c7c84a6ec97ca`
- `transforms.ts`: harmless rewrites applied to every message (small capitals, mathematical
  bold/sans, full-width, zero-width and soft-hyphen insertion, no-break and double spaces, line
  wrapping, upper/lower case, Cyrillic look-alikes, emoji, five equivalent amount formats and four
  combinations). A consistent detector gives each rewrite the same verdict as the original.

Expected labels: `likely_scam` or `suspicious` (scam), `probably_fine` (legitimate), `not_sure`
(ambiguous, such as a plain money request from a friend or an ordinary ticket resale).

Provenance: synthetic messages by one AI author who had seen the detector code, so the holdout is
not blinded. Public figures are named only as impersonation targets; no real numbers, accounts or
links. Filipino and Taglish need native-speaker review. Small synthetic sets do not measure
real-world accuracy.

## Results (Node CPU, multilingual-e5-small rebuilt from `public/models`)

Before: detector at `f38df78` (before any of this work). After: generalized payment, sender-claim
and normalization patterns of October 12, 2026. Only `dev.json` failures were used to change
rules; the holdout was scored once, after the changes. Consistency = rewrites that keep the
original verdict; escalated = benign rewrites that became more alarming.

| Set     | Mode       | Scam recall   | False alarms | Exact level | Consistency | Benign escalated |
| ------- | ---------- | ------------- | ------------ | ----------- | ----------- | ---------------- |
| dev     | rules only | 9/24 → 24/24  | 0/15 → 0/15  | 49% → 82%   | 92% → 100%  | 6 → 0            |
| dev     | embeddings | 10/24 → 24/24 | 1/15 → 1/15  | 44% → 78%   | 87% → 97%   | 11 → 5           |
| holdout | rules only | 8/24 → 13/24  | 1/15 → 1/15  | 42% → 58%   | 93% → 100%  | 6 → 0            |
| holdout | embeddings | 10/24 → 15/24 | 3/15 → 3/15  | 36% → 51%   | 89% → 97%   | 9 → 4            |

The holdout shows the fix generalizes only partly. The 11 holdout scams still missed (rules only):

- rigged raffles phrased without the dev verbs, 0/3 (`make your ticket the winner`,
  `sisiguraduhin kong ikaw ang mananalo`, `panalo ka basta 40% sa akin`);
- celebrity-team claims with an unseen sender or perk, 4 (`tagapamahala ni`, a nameless
  `your favorite singer`, `private dinner`, `puwesto sa harap`);
- relative claims without the listed phrases, 2 (`this is your aunt, using my friend's phone`,
  `bagong numero` without `ko`), one of them also using the unseen verb `wire`;
- a bank PIN request worded `text back your MPIN`, and a gift card request that says `email me
the codes`.

False alarms are the same messages as before the change. Remaining embedding inconsistencies come
from the model reading upper case, small capitals and emoji differently.

## Run

```powershell
$env:EVAL_CHALLENGE = '1'
$env:EVAL_EMBEDDINGS = '1'   # optional: real model on CPU, rebuilt from public/models
$env:CHALLENGE_OUTPUT = "$env:TEMP/challenge.json"
npx vitest run eval/challenge/run.challenge.test.ts
```
