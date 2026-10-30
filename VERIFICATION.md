# Verification — 30 October 2026, English/EUR update

- All ten existing Node tests passed after the name, currency metadata and model-alias changes. Controlled fixture results remain live:false and are not counted as real inference.
- Current CLI run, evidence/live-run.json: run dbef1483-7894-42f9-b851-1f8befbc44b8; 8 actual local Qwen3-0.6B-Q8_0 calls; peak 2 Mozaik loops; 2 overlapping live cross-agent call pairs; 2 discarded responses; no adapter or hard-constraint errors. Currency is explicitly EUR. Final V2-A3-F3 totals €462.00 including €42.00 reserve, within €480.00.
- Current browser run, evidence/live-browser-run.json: run 48417a8b-06f0-4e06-ab5d-75c462926bd9; 9 real calls, 5 overlapping cross-agent pairs, 3 discarded responses after changing the brief while the agents worked. The final review passed hard checks.
- Both browser download controls worked. The actual downloaded English planning note states EUR, €420.00 subtotal, €42.00 reserve, €462.00 total and €480.00 budget. The downloaded run JSON declares currency EUR and locale en-GB.
- Local preview returned HTTP 200 with Common Ground and EUR; its snapshot exposes matching currency metadata. The recorded mode was also inspected in the browser. The longer English brand fits both desktop and the 375-pixel mobile viewport (360 pixels of usable content width), with no horizontal overflow. New screenshots were captured from the actual application.
- Original BRL CLI and browser JSON records are preserved unchanged in evidence/archive/. Earlier live-midflight.json and live-run-before-budget-band.json remain historical BRL records. The retained small-model error motivated the existing computed budget-band guard; generated wording remains visibly unverified.
- The original Windows CPU model and server downloads were checksum verified. No paid inference, financial account or reused private key is involved.

## Limits and submission status

- The public site is a clearly labelled recording. Live editable inference requires the local Node and llama.cpp processes. A saved run never replaces a live request.
- Euro prices are authored fictional catalog values, not currency conversions or verified market prices. The host makes the final decision; no real venue, attendee, booking or payment is involved.
- Actual overlap intervals are not a benchmark of speedup, model quality or general reliability.
- The initial portal confirmation supplied by the participant is preserved unchanged in evidence/submission-confirmation.json and .png. It confirms the original entry. The participant subsequently confirmed the English/EUR and new-URL resubmission with a fresh official “Submitted.” screenshot, preserved in evidence/resubmission-confirmation-2026-10-30.json and .png. This confirms receipt, without independently exposing each submitted field.
