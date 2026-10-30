# Common Ground — Room for a Change

## Current status

The initial version was manually submitted as Ponto Comum — Room for a Change. Its original portal confirmation is preserved in evidence/submission-confirmation.json and .png. The revised English name, EUR presentation and new screenshots still need a manual portal update through Submit again. Existing repository and demonstration URLs are retained.

Track: Freestyle

Project name: Common Ground — Room for a Change

Repository URL: https://github.com/Brunof94-debug/ponto-comum-jigjoy

Live deployment URL: https://brunof94-debug.github.io/ponto-comum-jigjoy/

Demo URL: https://brunof94-debug.github.io/ponto-comum-jigjoy/

## What does it do?

Common Ground helps a community workshop host keep a workable plan when the budget, weather or venue changes. A Planner and an independent Feasibility Reviewer work concurrently, share priorities and proposals, and reconsider their work when the brief changes. Code calculates costs in integer cents and checks capacity, step-free access, rain shelter, venue closures and a 10% reserve. The interface and planning notes use English, with fictional prices in EUR. The host reviews the final plan; no bookings or payments are made. The hosted demo is a clearly labelled recording of a real local model run. The README explains how to run the live, editable application with a local model and no paid API.

## How do the agents run concurrently?

The Planner and Feasibility Reviewer are separate @mozaik-ai/core agents running independent runLoop loops against one shared RuntimeState. Both receive the same brief and can issue real inference requests concurrently. The Reviewer shares a planning priority while the Planner develops a proposal; runtime events notify the agents of changes to the constraints, priority, proposal and review. The Reviewer then examines the exact current proposal. Responses from older brief revisions are discarded, and a review must match the current proposal ID.

Both agents use actual Qwen3-0.6B-Q8_0 inference through llama.cpp with two parallel decoding slots. The current EUR browser run in evidence/live-browser-run.json records 9 completed real model calls, 5 overlapping Planner/Reviewer call pairs and 3 discarded stale responses after a change during inference. The recorded plan totals €462.00, including the 10% reserve, within a €480.00 budget. The repository includes timestamped runtime events, loop IDs, request/response fingerprints and deterministic tests explicitly distinguished from real model runs. Model-generated wording is marked unverified; code performs the hard constraint checks.

## Screenshots and manual update

Use the three current English screenshots in the delivery folder. Review the form and Hackathon Rules, then resubmit manually before 31 October 2026, 20:00 CET (16:00 Brasilia). The latest submitted entry is judged. Save the actual updated confirmation; the first receipt does not prove the new form values have been submitted.

General JigJoy terms, section 5, restrict automated access without express written permission: https://jigjoy.ai/terms-of-use . AI-assisted development is allowed by the hackathon rules. Prize payment, if awarded, requires an eligible Upwork account; no financial account has been created.
