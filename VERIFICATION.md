# Verification — 30 October 2026

## Verified

- `npm test`: all ten tests passed on Node 22. Fixtures are explicitly marked non-live.
- Actual local Qwen3-0.6B-Q8_0 inference, using the official checksum-verified llama.cpp b11960 Windows CPU release and two slots.
- Current `evidence/live-run.json`: 10 completed real model calls; peak 2 Mozaik loops; 4 overlapping cross-agent call pairs; 2 stale answers discarded. The two constraint revisions settled without adapter or hard-constraint errors. Final proposal V2-A3-F3 costs R$462.00 including R$42.00 reserve, within R$480.00.
- Actual change-during-inference run retained in `evidence/live-midflight.json`: six real calls, three overlapping pairs and three discarded stale answers. That run predates the explicit budget-band input guard; the current implementation's cross-revision behavior also passes the controlled Mozaik race test.
- The initial model arithmetic/comparison error is retained in `evidence/live-run-before-budget-band.json`. Current code supplies the computed budget band and rejects disallowed priorities. Model notes still have factual and wording limitations; they are visibly marked unverified in the interface.
- Local HTTP root returned 200 with the intended application title. See the HTTP probe record for route and origin checks.
- No existing project keys or private model data were reused. No account or paid inference was created. Mozaik cloud telemetry was disabled for the application process.

## Follow-up and remaining limits

- Follow-up with the browser available on 30 October: the published recording was inspected at desktop and at a 375 CSS-pixel mobile viewport; no horizontal overflow was observed. Both download buttons produced files whose contents were checked. The local interactive application was exercised with a brief change during live inference. See evidence/live-browser-run.json and evidence/screenshots/. This does not constitute testing on every device.
- Local run intervals show concurrency, not a benchmark of quality or speedup. No real-world workshop, customer, attendee or venue was involved.
- The public static site is a labelled saved run; live editable inference requires the local Node and llama.cpp processes.
- Contest submission confirmed from the participant-provided screenshot of the official portal on 30 October, showing ‘Submitted.’ and gallery publication. See evidence/submission-confirmation.json and evidence/submission-confirmation.png. The screenshot does not show the submitted field values or a gallery entry URL. The pending-submission reminder was deleted.

