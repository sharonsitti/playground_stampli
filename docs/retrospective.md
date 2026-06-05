# Retrospective

Observations about how the team operates — collaboration, coordination, and process. Not about features or output.

Each entry is one sentence. Append as events happen; never edit or delete an existing entry.

---

## Went well

- The team genuinely self-organized — engineers coordinated directly with each other without waiting for me to broker every handoff, which is exactly the behavior a distributed team needs.
- When I made a decision and communicated it clearly, the team executed without relitigating it; there was no second-guessing or scope creep from any agent.
- Agents flagged blockers early rather than silently stalling, which meant I could unblock them quickly and keep the delivery moving.
- The team's instinct to stay inside their scope boundaries was strong — nobody tried to expand their remit or do each other's jobs.
- QA consistently grounded test proposals in the spec rather than the implementation, which meant their test coverage actually enforced the contract rather than just reflecting what the code did today.

## Not so well

- The team generated a lot of noise — idle notifications, status re-confirmations, and re-asks for approvals already granted — and it was hard to distinguish signal from echo; agents should trust that their messages were received and wait for a response rather than repeating.
- I introduced the "critical-only" issue policy mid-session rather than upfront, which forced the team to undo work they had already done in good faith; ground rules like this belong at the start, not when we're already in motion.
- Several agents stayed active and communicating well past the point where their work was done, generating overhead that consumed shared resources without producing value; a cleaner stand-down cadence would help.
- When the token budget tightened, the team didn't naturally shift into a leaner operating mode — I had to manually tell each agent to stop proposing and start shipping, which suggests the team defaulted to thoroughness even when speed was clearly the priority.
- The same mistake (leaving scratch files in the working tree before signaling done) happened multiple times across different PRs despite being flagged; the team read the retrospective but didn't internalize it as a working norm.
