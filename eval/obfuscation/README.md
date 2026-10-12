# Obfuscation and Taglish money-request sets

Casual, obfuscated Filipino and Taglish messages written for the detector work of October 12, 2026:
Unicode small capitals, mathematical and full-width letters, invisible characters, look-alike
letters, line breaks, Filipino/Taglish money verbs (`sendan`, `padalhan`, `pa-send`, `mag-GCash`),
celebrity or employer impersonation with a payment, offers to rig a prize for a cut, and benign
controls (completed transfers, scam warnings, mentions, ordinary bill splits and reservations).

- `dev.json`: 32 cases. Contains the three user-reported messages (`ob-dev-orig-*`) and the
  related probe messages. Used while changing normalization, rules and asks.
- `holdout.json`: 36 cases (12 per language). Written after the dev probe and before any detector
  change, then frozen. Not used to tune. SHA-256: `a3add8581ab49f49895b241895c666f2473522ef981c59a7fef9e7b67a9a454c`

Expected labels: `likely_scam` or `suspicious` (scam), `probably_fine` (legitimate), `not_sure`
(ambiguous, such as an ordinary money request from a friend that the text alone cannot judge).

Provenance: the `ob-dev-orig-*` texts are user-supplied; every other message is synthetic, by one
AI author who had seen the detector code, so the holdout is not blinded. Names of public figures
are used only as impersonation targets; no real numbers, accounts or links. Filipino and Taglish
need native-speaker review. Small synthetic sets do not measure real-world accuracy.

Both sets run in `eval/context/run.context.test.ts` (see `eval/context/README.md`).

## Results (Node CPU, multilingual-e5-small rebuilt from `public/models`)

Before: detector at `f38df78`. After: normalization, ask and rule changes of October 12, 2026,
including the generalized patterns measured in `eval/challenge`.
Recall counts `not_sure` scams as misses.

| Set     | Mode       | Scam recall  | False alarms | Abstained     | Exact level |
| ------- | ---------- | ------------ | ------------ | ------------- | ----------- |
| holdout | rules only | 5/17 → 17/17 | 2/14 → 2/14  | 8/36 → 4/36   | 42% → 81%   |
| holdout | embeddings | 7/17 → 17/17 | 2/14 → 2/14  | 6/36 → 3/36   | 42% → 78%   |
| dev     | rules only | 2/16 → 15/16 | 1/5 → 1/5    | 11/32 → 11/32 | 38% → 94%   |
| dev     | embeddings | 3/16 → 15/16 | 2/5 → 2/5    | 8/32 → 7/32   | 28% → 78%   |

The remaining false alarms were already flagged before the change: ticket reservations paid at a
box office, outlet or app (`ob-dev-fp-ticket-legit`, `ob-ho-en-06`, `ob-ho-tl-08`), plus
`ob-dev-fp-won-share` with embeddings. The remaining dev miss is letter-spaced text
(`S E N D mo ang O T P`), which normalization deliberately does not rejoin.
