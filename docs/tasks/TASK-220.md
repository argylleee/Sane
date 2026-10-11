# TASK-220: trust, help and history features (frontend, backend, model data)

- Status: ready
- Owner / role / platform: coordinator-run single writer, Claude Code
- Branch / base revision: `codex/feat/task-220-trust-help-history`, base `9004694`
- Change type / commit subject: `feat(app): add history, help contacts, result breakdown and comfort modes`
- Interface contract: `src/types.ts` gains optional `Verdict.findings` and `Finding` (additive, no consumer breaks)
- Allowed files: new `src/history/`, `src/privacy/`, `src/a11y/`, `src/share/`, `src/prefs.ts`, `src/rules/details.ts`, `src/explain/breakdown.ts`, `src/data/contacts.ts`, `src/data/scamTypes.ts`, `src/ui/` additions, wiring in `src/ui/App.tsx` and `src/ui/MobileNavigation.tsx`, `src/pipeline/analyze.ts` (one line), `src/styles.css` (comfort modes), decision D-14

## Outcome and acceptance

- Observable outcome: a third History tab; result page shows numbers and accounts, who to contact, why this result, privacy proof, share/copy/read-aloud and a wrong-result note; Learn page lists scam explainers and has language, family mode and high contrast settings.
- Acceptance evidence: 386 app tests pass (4 opt-in eval suites skipped), lint, typecheck; manual run in Chrome at desktop width and a 360 px frame (no horizontal overflow); a real check showed 0 requests, a masked history preview, a saved note, family mode switching to Filipino, and high contrast applying.
- Out of scope: any change to scoring or thresholds, cloud lookups, PNP/NBI phone numbers (sources disagree).

## Limits

- Read-aloud shows only when the browser has a local voice for the language. Not tested here with a Filipino voice.
- Share Sheet with files is not tested on a phone; the desktop path (download) renders correctly in-page.
- Privacy proof lists what the browser's resource timing recorded. It does not cover WebSocket traffic.
- Filipino and Taglish strings (`src/ui/copyExtra.ts`, `src/data/scamTypes.ts`, `src/data/contacts.ts`) await native-speaker review.
- Contact details were checked October 11, 2026 from public pages; re-check before each release.
