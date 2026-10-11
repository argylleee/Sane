# RULES.md: Sane project rules

Load this first. These rules apply to every task in the project. Each one exists
because breaking it costs points or breaks the demo.

## Hackathon rules (AppBuildersPH 2026, Local AI)

- **1.** **Built during the hackathon.** Do not paste in old project code. Libraries and open-source models are fine.
- **2.** **Core AI runs on the user's device.** OCR, embeddings and the LLM all run in the browser. No cloud AI API in the core path.
- **3.** **Working product, demonstrated live.** A boring feature that works beats a clever one that crashes.
- **4.** **Disclose everything.** Every model, API, framework and major tool goes in the disclosure table (see `skills/demo-submission`).
- **5.** **Every submission must answer:** "Why does this product benefit from running AI locally?" The answer lives in `skills/demo-submission/SKILL.md`. Keep it consistent everywhere.
- **6.** **Deadline: 10:00 AM, Oct 10, no extensions.** Feature freeze 3 hours before. Submit 1 hour before.

## Project constraints (from the team)

- **7.** **No pretraining, no fine-tuning, no dataset labeling.** Off-the-shelf models, prompting, retrieval, and plain code only. Hand-written archetypes and keyword lists are reference data, disclose them as such.
- **8.** **Web only, mobile-first.** One responsive website, designed for a 360 px phone screen first and installable as a PWA. No native or mobile app code. Phones must get a verdict even with no LLM.
- **9.** **Philippine focus, daily use.** Scam patterns, brands, languages and copy are Philippine. A user should be able to check any suspicious message on any day.
- **10.** **Three languages:** English, Filipino, Taglish. Input and output copy must handle all three.

## Engineering rules

- **11.** **Code decides facts, models help with meaning.** Links, lookalike domains and OTP requests are detected by code. The LLM never decides the risk level.
- **12.** **Every layer has a fallback.** No WebGPU: smaller model or skip the LLM. LLM fails: template explanation. OCR fails: ask for pasted text. The app always returns a verdict.
- **13.** **Zero network during a check.** After first load, scanning a message makes no requests. Prove it with the Network tab. The only exception is Vercel Web Analytics and Speed Insights on the production site: anonymous page-view and load-speed beacons to our own origin (`/_vercel/...`), which never contain message text, images or scan results. A speed-insights beacon can fire when the page is hidden or closed, so filter the Network tab by `_vercel` when proving this.
- **14.** **User text is untrusted data.** Never render it as HTML, never fetch its links, never let it instruct the LLM.
- **15.** **Say "Not sure" when unsure.** A confident wrong verdict on stage is the worst outcome.

## Style rules

- **16.** Plain, human-sounding copy. Short sentences. No em dashes in docs or UI copy.
- **17.** When there are real options, list them with trade-offs instead of one prescriptive answer.
- **18.** Small commits, working app at every checkpoint. Never leave `main` broken after the freeze.
