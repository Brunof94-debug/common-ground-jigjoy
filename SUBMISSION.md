# Submission materials — portal confirmation received

Track: Freestyle

Project name: Ponto Comum — Room for a Change

Short description:
A local workshop planning desk where two Mozaik agents work in parallel, share constraints and peer feedback, and discard stale answers when a budget, weather or venue changes.

Description:
Ponto Comum helps a community workshop host keep a workable plan when the brief changes. A Planner selects a venue, activity and refreshments from an original fictional catalog while an independent Feasibility Reviewer scans the same brief concurrently. The reviewer shares a planning priority, the Planner adapts, and the reviewer examines the exact current proposal. A later change invalidates old responses, including answers still in flight.

Both participants are real Mozaik agents using runLoop and a shared RuntimeState. Each performs actual local Qwen3-0.6B-Q8_0 inference through llama.cpp with two parallel decoding slots. The repository includes timestamped Mozaik events, loop IDs, request/response fingerprints, a change-during-inference run and deterministic tests that are explicitly distinguished from real model results.

Code calculates costs in integer cents and checks capacity, step-free access, rain shelter, closures and a 10% reserve. Model-generated notes remain unverified wording; the host makes the final decision. No bookings, payments or personal data are involved. A small model reasoning error from the first run is retained and explained alongside the guard it motivated.

The GitHub Pages demo is a read-only record from an actual local run, clearly labelled as recorded. The README provides commands for the live editable application, without a paid account or API key. Built during the event, with Codex assistance, by solo participant Bruno Fernandes.

Repository URL: https://github.com/Brunof94-debug/ponto-comum-jigjoy
Demo URL: https://brunof94-debug.github.io/ponto-comum-jigjoy/ (recorded real local run; HTTP 200 and GitHub Pages deployment verified)

Participant: Bruno Fernandes
GitHub: Brunof94-debug
Contact email: use the email already registered in the participant portal.

## Portal submission record

The participant manually submitted the project on 30 October 2026 and provided a screenshot of the official portal showing ‘Submitted.’ and confirming gallery publication. See [the receipt](evidence/submission-confirmation.json) and [the original screenshot](evidence/submission-confirmation.png). This records the visible portal confirmation; the submitted field values were not independently inspected after submission. The pending-submission reminder was deleted after confirmation.

The general JigJoy Terms of Use, section 5, restrict automated access without express written permission. The existing preparation therefore leaves portal entry and final submission to the participant. Official document: https://jigjoy.ai/terms-of-use . This does not prohibit the expressly permitted AI-assisted development of the project itself.

Official updated deadline: 31 October 2026, 20:00 CET = 16:00 Brasilia time. Internal target remains 08:00 Brasilia to leave a margin. Prize payment, if awarded, requires an eligible Upwork account; no financial account has been created.



