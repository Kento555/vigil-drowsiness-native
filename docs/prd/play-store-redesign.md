# Play Store Redesign — VIGIL

```
Title: Play Store Redesign
Author: Generated via PRD Generator (prd-writer subagent)
Date: 2026-09-18
Last updated: 2026-09-18
Version: 0.1 — Draft
Status: Draft
Complexity tier: Tier 3 — Major initiative (8 epics, 3 sets of competing/unresolved
  designs, a safety-critical alarm path, and Google Play + Singapore PDPA compliance
  gates that need legal/compliance and hardware QA sign-off before ship)
Context: Mode B — General product context applied (PDPA-specific NFR retained:
  camera frames, biometric-adjacent signals, and account data are genuinely touched)
```

---

## 1. Overview

VIGIL is a React Native (Expo) drowsiness-detection app for drivers, distributed via
Google Play on Android. Today's UI exposes raw ML detector internals (EAR/MAR scores,
event counters) directly to drivers instead of plain-English guidance, has no
supported way to keep monitoring active with the screen off, and does not meet Google
Play's prominent-disclosure requirement for background camera use or Singapore PDPA
obligations for the camera-frame and drowsy-moment data it touches. This initiative —
sourced from the Claude Design canvas "Vigil / Play Store redesign" (artifact
`M2W21ZAYbjVW9ezBHJd2E7`) and already captured in detail as user stories at
`docs/user-stories/play-store-redesign-flow.md` — redesigns onboarding, the pre-drive
and active-monitoring screens, the drowsiness alarm, post-drive summary, settings, and
privacy/consent flows so that: (1) technical detector internals are hidden behind
plain-English states, (2) screen-off driving is supported without draining battery or
causing night-time glare, and (3) Google Play's prominent-disclosure requirement and
Singapore PDPA obligations are met end-to-end. Success is judged against the goals
and metrics in Section 5 — principally, that no raw detector values ever reach the
driver-facing UI, that a screen-off monitoring mode ships and holds up under
battery/glare QA, and that consent, disclosure, and data-deletion flows pass
compliance review.

---

## 2. Problem statement

**The problem:** The current VIGIL UI shows drivers raw ML/technical detector output
(EAR/MAR scores, event counters) instead of plain-English states, offers no way to
keep monitoring active with the screen off, and does not give the in-app,
pre-permission disclosure Google Play requires for background camera use, nor the
PDPA-required consent/deletion/breach-notification mechanics for the camera and
drowsy-moment data it touches.

**Who experiences it:** The Driver (App User) — VIGIL's only user role — driving with
the phone dash-mounted at arm's length, Android-first, portrait orientation only.

**Current workaround:** None in-product; drivers currently read raw detector output
directly and have no supported screen-off mode, which is itself a driving-distraction
and battery-drain concern *(assumed from the design brief; not separately evidenced by
user research — see Section 4)*.

**Why this matters now:** Google Play's prominent-disclosure policy and Singapore
PDPA are compliance gates the current app does not clear today, creating listing and
regulatory risk. The redesign is already scoped in detail (source design canvas +
user-stories documentation), making this the natural next initiative to formalize
into a PRD.

---

## 3. Context and background

- **Background:** VIGIL was extracted as a standalone native app from an earlier
  project (per repo history: "Initial commit: extract native app from
  vigil-drowsiness"). Detection logic already exists in `lib/detector.ts`
  (EAR/MAR + head-pitch thresholds); this redesign reuses that logic unchanged,
  remapping it to three named sensitivity presets (Relaxed / Standard / Strict) —
  no new detection/ML algorithm work is in scope.
- **User research:** `[TBD — no user research evidence is cited in the source design
  or the user-stories doc. Validate the screen-off model and disclosure copy with
  real drivers before visual design is locked.]`
- **Competitive analysis:** `[TBD — not covered in the source input.]`

---

## 4. Goals and success metrics

| Goal | Metric | Baseline | Target | Measurement method |
|---|---|---|---|---|
| Hide technical/ML detector internals behind plain-English states | # of raw detector values (EAR/MAR scores, event counters) rendered anywhere in driver-facing UI | Exposed today on multiple screens | 0 | UI audit across all screens each release; automated content-lint where feasible |
| Support screen-off driving without draining battery or causing night-time glare | Measured display luminance in screen-off mode; battery drain per hour of screen-off watching | `[TBD — not currently instrumented]` | Luminance below a defined low-glare threshold (device QA to confirm exact value, per Story 4.1); battery-drain target `[TBD]` | Device QA bench testing (see Epic 4 story-level success metrics) |
| Meet Google Play's prominent-disclosure requirement and Singapore PDPA obligations end-to-end | % of camera-permission requests preceded by in-app disclosure; % of deletion requests completed within 30 days; % of notifiable breaches reported within 3 calendar days | 0% today (no disclosure screen exists) | 100% / 100% / 100% | Analytics event-ordering check; deletion-request audit log; breach-response runbook timing |

Efficiency, adoption, and quality baselines are largely `[TBD]` — no product
instrumentation baseline was supplied in the source input. **Success metrics must be
confirmed with instrumentation before sprint planning begins.**

---

## 5. Scope

### In scope

- **Epic 1 — Onboarding & consent:** value-proposition screen, prominent camera
  disclosure before the OS permission prompt, sign-in/create account.
- **Epic 2 — Pre-drive readiness & start:** home screen that confirms the app is
  ready to monitor and starts a session (two competing designs carried pending
  decision — see Open Questions).
- **Epic 3 — Active monitoring, screen on:** plain-language status word, live
  preview, no raw detector output.
- **Epic 4 — Active monitoring, screen off:** screen-off watching without battery
  drain or glare (three competing designs carried pending decision — see Open
  Questions).
- **Epic 5 — Drowsiness alarm:** full-screen, multi-channel alarm with a two-tap
  dismiss and Do Not Disturb override. Safety-critical path.
- **Epic 6 — Post-drive summary & history:** single alertness score plus
  plain-language summary, weekly risk-pattern chart, no raw counters.
- **Epic 7 — Settings & alert preferences:** sensitivity presets, alert-channel
  toggles, no exposed numeric thresholds.
- **Epic 8 — Privacy, data safety & PDPA compliance:** data-safety summary, full
  privacy policy, consent withdrawal, account/data deletion within 30 days, breach
  notification within 3 calendar days to the PDPC.

### Out of scope

| Item | Reason out of scope | Revisit trigger |
|---|---|---|
| iOS-specific onboarding/permission flows | Design brief states "Android first"; iOS camera-permission and background-service models differ substantially | If/when iOS support is prioritized |
| Detection algorithm/threshold tuning itself (`lib/detector.ts` internals) | Redesign only remaps existing thresholds to 3 presets; the ML/CV logic is unchanged | If detection accuracy issues are reported separately from this UI redesign |
| Google Play Store listing assets (screenshots, description copy) | Flagged as a "try next" item in the source design, not part of the in-app workflow | When preparing the actual Play Store submission |
| Multi-driver / shared-device support | No such actor or flow appears anywhere in the design | If a household/shared-vehicle use case is proposed |
| The "drowsy-but-not-yet-alarming" intermediate state | Explicitly flagged as unshown in the source design ("try next" list) | If product wants a pre-alarm warning state between ALERT and the full alarm |

### Future considerations

- iOS support, once Android-first ships and is stable.
- A "drowsy-but-not-alarming" intermediate state, if product wants a pre-alarm
  warning tier.
- Multi-driver/shared-device support, if a household or shared-vehicle use case is
  proposed.
- Actual Play Store listing assets and copy, once this redesign is ready to submit.

---

## 6. Users

**Driver (App User)**
- Context: Operates the phone dash-mounted at arm's length while driving an Android
  device, portrait orientation only; interaction is expected primarily pre-drive and
  post-drive, with minimal interaction mid-drive for safety.
- Primary job to be done: Start a monitored drive quickly, understand at a glance
  whether they're being watched and alert without parsing technical detail, and be
  woken decisively if drowsy.
- Pain point: The current UI exposes raw ML internals instead of plain-English state,
  has no working screen-off mode, and doesn't clearly disclose background camera use
  before asking for permission.
- Tech fluency: Medium *(assumed — general consumer driver persona; no explicit
  fluency research supplied)*.
- Language / accessibility: `[TBD — only a ≥56px tap-target requirement is specified
  in the source design for dash-mounted, arm's-length use; no localization or WCAG
  target given]`.

This is the only primary role identified in the source input; no roles are being
deprioritized.

---

## 7. User stories

Full functional requirements and Given/When/Then acceptance criteria for each story
already exist in `docs/user-stories/play-store-redesign-flow.md` — this table is a
condensed index with MoSCoW priority; it is not a replacement for that document.

| # | User story | Priority | Notes |
|---|---|---|---|
| 1.1 | As a first-time driver, I want to see what Vigil does and why it needs my camera, so I can decide whether to continue before any permission prompt appears. | Must | Entry point of the app |
| 1.2 | As a driver, I want to be clearly told Vigil uses my camera in the background — including with my screen off — before the OS permission prompt, so I can give informed consent. | Must | Satisfies Google Play prominent-disclosure requirement |
| 1.3 | As a driver, I want to sign in or create an account via Google or e-mail, so my drive history persists across devices. | Must | Detection itself works without an account (AS-05) |
| 2.1a | (Option A) As a driver about to start a trip, I want one clear "start watching" action and a plain-English readiness state. | Should | Competing with 2.1b — see OQ-02 |
| 2.1b | (Option B) As a driver about to start a trip, I want to be walked through a pre-drive checklist (phone mounted, face visible, volume audible). | Should | Competing with 2.1a — see OQ-02 |
| 3.1 | As a driver mid-drive with the screen on, I want one status word and one supporting sentence, not technical detail. | Must | Core screen-on monitoring experience |
| 4.1 | (Screen-off option) Pocket mode — near-black display with a single breathing indicator. | Should | Competing with 4.2/4.3 — see OQ-01 |
| 4.2 | (Screen-off option) Notification-as-interface — the mandatory foreground-service notification doubles as the status display. | Should | Competing with 4.1/4.3 — see OQ-01 |
| 4.3 | (Screen-off option) Low-power dash face — dimmed clock display with live status. | Should | Competing with 4.1/4.2 — see OQ-01 |
| 5.1 | As a driver whose eyes have been closed past the safe threshold, I want a full-screen, multi-channel alarm requiring two deliberate taps to dismiss. | Must | Safety-critical path — highest-priority QA target |
| 6.1 | As a driver who just finished a drive, I want one score and one plain-language sentence summarizing how alert I was. | Must | No raw counters shown |
| 6.2 | As a driver with multiple recorded drives, I want to see when I'm most at risk across the week. | Should | Requires ≥1 completed drive to render |
| 7.1 | As a driver, I want to change alert sensitivity and channels without needing to understand detector thresholds. | Must | Shared preset store also read by Epic 2 and Epic 5 |
| 8.1 | As a driver, I want a short, plain-language summary of what never leaves my phone vs. what's saved to my account. | Must | Compliance-critical |
| 8.2 | As a driver, I want to withdraw consent and delete my account and all data at any time, without penalty or justification. | Must | PDPA-critical; legal review pending — see OQ-05 |

---

## 8. Functional requirements

Grouped by feature area and condensed from the detailed per-story FRs in
`docs/user-stories/play-store-redesign-flow.md`. Requirements touching an external
system are tagged `[INTEGRATION DEPENDENCY]` and mirrored in Section 12.

**Onboarding & consent**
- FR-01: The system shall display an onboarding value-proposition screen before
  requesting any device permission.
- FR-02: The system shall display a dedicated disclosure screen naming background
  camera use explicitly, before triggering the native OS camera-permission dialog.
- FR-03: The disclosure screen shall state that images are read on-device and
  discarded instantly, that no video/photo is recorded, saved, or uploaded, and that
  a persistent notification will show whenever the camera is active.
- FR-04: The system shall provide an "Allow camera" action (which then triggers the
  OS permission prompt) and a "Not now" action that leaves detection unavailable
  without requesting the OS permission. `[INTEGRATION DEPENDENCY: Android OS camera
  permission API]`
- FR-05: The system shall let a driver sign in or create an account via Google OAuth
  or e-mail/password, on a single screen with a segmented Sign-in/Create-account
  control. `[INTEGRATION DEPENDENCY: Google OAuth provider; auth backend]`
- FR-06: If authentication fails, the system shall display an inline, specific error
  (credentials vs. network) and shall not fail silently.

**Pre-drive readiness & start**
- FR-07: The system shall display a plain-English readiness state with no numeric
  detector readouts before a drive starts.
- FR-08: The system shall provide a 3-way sensitivity selector (Relaxed / Standard /
  Strict) with a one-sentence, plain-English consequence per option, and no numeric
  thresholds shown. `[INTEGRATION DEPENDENCY: lib/detector.ts preset mapping]`
- FR-09: The system shall gate the "START WATCHING" action on camera permission
  being granted and a face being detectable.
- FR-10: The system shall provide a "screen off while watching" toggle from this
  screen.

**Active monitoring — screen on**
- FR-11: The system shall display exactly one plain-English status word derived from
  the current detector state, with no visible counters, event logs, or numeric
  readouts. `[INTEGRATION DEPENDENCY: lib/detector.ts real-time state stream]`
- FR-12: The system shall display a live camera preview labeled "Preview only —
  nothing is recorded" and shall never persist any frame from it.
- FR-13: The system shall provide "Turn the screen off" and "Stop watching" actions
  from the active-monitoring screen.

**Active monitoring — screen off**
- FR-14: The system shall keep drowsiness detection and alarm triggering active
  regardless of which screen-off display model is shown or whether it is expanded or
  collapsed. `[INTEGRATION DEPENDENCY: Android foreground service]`
- FR-15: The system shall surface the mandatory Android foreground-service
  notification with current status, elapsed duration, and PAUSE/STOP actions whenever
  screen-off watching is active.
- FR-16: The system shall keep display brightness at or below a defined low-glare
  level throughout screen-off watching, brightening only when the alarm needs to take
  over.

**Drowsiness alarm**
- FR-17: The system shall take over the full screen with a high-contrast alarm state
  when the drowsiness threshold for the active sensitivity preset is crossed,
  regardless of screen-on/screen-off state.
- FR-18: The system shall simultaneously trigger spoken audio, a siren, and device
  vibration when the alarm fires.
- FR-19: The system shall require exactly two sequential taps on the dismiss control
  to silence the alarm; only the second tap shall stop all channels.
- FR-20: The alarm shall override Do Not Disturb / silent mode so audio and
  vibration are audible even if the device is muted. `[INTEGRATION DEPENDENCY: DND
  override permission]`
- FR-21: The system shall log every alarm event (timestamp, cause category) to the
  driver's drive record regardless of how quickly it is dismissed.

**Post-drive summary & history**
- FR-22: The system shall display drive duration, a single 0–100 alertness score, and
  a one-sentence plain-language summary at drive end.
- FR-23: The system shall NOT display raw per-event counters (eye events, nods, etc.)
  anywhere in the summary or history screens.
- FR-24: The system shall display a weekly risk-by-time-of-day chart derived from the
  driver's own historical drowsy-moment timestamps, with an empty state when zero
  drives exist.

**Settings & alert preferences**
- FR-25: The system shall provide the same 3-way sensitivity selector available on
  the home screen, with identical plain-English descriptions, from Settings.
- FR-26: The system shall provide independent toggles for spoken warning, siren, and
  vibration alert channels, and shall prevent (or explicitly warn against) a state
  where all three are disabled simultaneously.
- FR-27: The system shall apply sensitivity/channel changes to the next watching
  session without requiring an app restart.
- FR-28: The system shall never display a numeric threshold value (seconds, EAR/MAR
  scores) anywhere in Settings.

**Privacy & PDPA compliance**
- FR-29: The system shall display two distinct data lists: data that never leaves the
  device (camera images, face data, audio) and data saved to the account (e-mail,
  name, drive timestamps, drowsy-moment occurrences).
- FR-30: The system shall provide "Download my data" and "Delete my account and data"
  actions, routing deletion through a confirmation flow rather than deleting
  immediately.
- FR-31: The system shall provide a full privacy policy covering collection purpose,
  consent/withdrawal, retention periods, storage location/cross-border transfer
  terms, security measures, access/correction rights, and a named DPO contact.
  `[INTEGRATION DEPENDENCY: Supabase backend, Singapore region]`
- FR-32: The system shall complete account and data erasure within 30 days of a
  confirmed deletion request, including from backups.
- FR-33: The system shall respond to data access/correction requests within 30 days,
  or communicate a reason and revised timeline if unable to meet it.
- FR-34: The system shall not refuse a consent-withdrawal or deletion request without
  stating the specific legal ground for refusal.

---

## 9. Non-functional requirements

| Category | Requirement | Notes |
|---|---|---|
| Performance | Status word updates within 1s of an underlying detector state change; screen-off overlay expand latency ≤300ms in 95% of trials | Per Stories 3.1, 4.1 |
| Security | TLS 1.2+ and AES-256 for data in transit/at rest; Supabase row-level security; DND-override permission requested and handled per Android policy | Per Story 8.2 technical/compliance notes |
| Scalability | `[TBD — no concurrency/volume target given in source input]` | |
| Availability | `[TBD — no uptime SLA given in source input]` | |
| Accessibility | Tap targets ≥56px for dash-mounted, arm's-length use; WCAG conformance level `[TBD]` | |
| Compliance | Google Play prominent-disclosure policy for background camera use; Singapore PDPA — purpose limitation (no advertising/profiling use, no sale/share of data), cross-border transfer limitation for any sub-processor outside Singapore, 30-day access/correction/deletion response window, 3-calendar-day notifiable-breach reporting to the PDPC | Genuinely relevant given camera frames, biometric-adjacent signals, and account data are touched — retained despite Mode B (general context) |
| Data retention | Camera frames are never persisted (discarded on-device, frame-by-frame); retention period for drive/drowsy-moment records prior to account deletion is `[TBD]` | |

---

## 10. Design

**User flow (primary path):**
1. Onboarding value proposition (1.1) →
2. Prominent camera disclosure (1.2) → OS permission prompt →
3. Sign-in / create account (1.3) →
4. Home / pre-drive readiness (2.1a or 2.1b) →
5. Start watching →
6. Active monitoring — screen on (3.1) or screen off (4.1 / 4.2 / 4.3) →
7. [Drowsiness alarm (5.1), if threshold crossed, overrides any state above] →
8. Stop watching →
9. Post-drive summary (6.1) → drive history (6.2)

Decision points: consent declined at disclosure (dead-end back to a state without
detection until disclosure is re-accepted); OS permission denied after in-app
"Allow" (retry path surfaced via Settings); no face detected at readiness (blocks
"START WATCHING"); alarm dismiss requires two deliberate taps and cannot be silenced
by a single tap or by obstructing the screen.

**Wireframes / mockups:** Source Claude Design canvas "Vigil / Play Store redesign"
(artifact `M2W21ZAYbjVW9ezBHJd2E7`). `[TBD — a direct shareable link should be added
by design/PM with canvas access]`.

**Technical considerations:** Reuses `lib/detector.ts` unchanged, only remapped to 3
sensitivity presets — no new ML/CV work. Screen-off watching and the alarm both
require an Android foreground service to keep the camera active with the screen off.
The alarm requires a Do Not Disturb override permission grant. The backend is
Supabase (Singapore region, `ap-southeast-1`) with row-level security and a
backup-deletion pipeline capable of honoring erasure within 30 days. **Architecture
review is recommended before Epic 4 and Epic 8 implementation**, given the unresolved
screen-off model choice (OQ-01) and the pending compliance review (OQ-05).

---

## 11. Timeline, dependencies and risks

**Milestones**

| Milestone | Target date | Exit criteria |
|---|---|---|
| Home-screen (Epic 2) and screen-off (Epic 4) design decisions | `[TBD]` | PM/Design select one option per epic (or confirm user-selectable) |
| Legal/compliance review of PDPA claims (Epic 8) | `[TBD]` | Compliance sign-off recorded before Story 8.2 ships |
| Hardware QA sign-off on alarm audibility (Story 5.1) | `[TBD]` | Target dB confirmed and measured achievable in-cabin |

**Dependencies**

| # | Dependency | Type | Owner | Needed by | Status |
|---|---|---|---|---|---|
| DEP-01 | Google OAuth provider | External / Vendor | Eng | Story 1.3 | `[TBD]` |
| DEP-02 | Supabase backend (Singapore, `ap-southeast-1`) with row-level security | External / Vendor | Eng | Epics 1, 6, 7, 8 | `[TBD]` |
| DEP-03 | Android foreground service + notification channel supporting action buttons | Platform / OS | Eng | Epic 4, Epic 5 | `[TBD]` |
| DEP-04 | Do Not Disturb override permission | Platform / OS | Eng | Epic 5 | `[TBD]` |
| DEP-05 | Legal/compliance review of PDPA claims | Internal team | Legal | Epic 8 | Open — see OQ-05 |

**Risks**

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| RK-01 | Epic 4 (screen-off) ships without a single chosen design, delaying release | M | H | PM/Design decide, or ship all three as user-selectable | PM / Design |
| RK-02 | Epic 2 (home screen) ships without a single chosen design | M | M | Same as above | PM / Design |
| RK-03 | Alarm not audible enough over road/music noise (no dB target defined) | M | H — safety-critical | Hardware QA defines and signs off a target dB before ship | Hardware QA |
| RK-04 | PDPA claims shipped without legal review | M | H — regulatory | Legal/compliance sign-off gate before Epic 8 ships | Compliance |
| RK-05 | "Delete account" flow diverges between Settings and Privacy entry points | L | M | PM confirms a single shared flow before dev starts | PM |

---

## 12. Stakeholder alignment and sign-off

| Stakeholder | Interest | Sign-off required | Name | Status |
|---|---|---|---|---|
| Engineering | Feasibility, effort | Yes | `[TBD]` | Pending |
| Design | UX/UI approach, especially the Epic 2 / Epic 4 option decisions | Yes | `[TBD]` | Pending |
| QA | Test coverage, especially alarm audibility and screen-off luminance/battery | Yes | `[TBD]` | Pending |
| Legal | PDPA compliance claims | Yes — see OQ-05 | `[TBD]` | Pending |
| Security | DND override, Supabase RLS, encryption | If applicable | `[TBD]` | Pending |
| Business owner / PM | Scope and value | Yes | `[TBD]` | Pending |

---

## 13. Open questions and assumptions log

Carried forward verbatim from `docs/user-stories/play-store-redesign-flow.md`
(unresolved there — not re-resolved here), plus new items surfaced while drafting
this PRD.

| # | Type | Description | Owner | Due by |
|---|---|---|---|---|
| OQ-01 | Open question | Which screen-off model ships: pocket mode, notification-as-interface, or dim dash face — or should all three be user-selectable? | PM / Design | Blocks Epic 4 (Stories 4.1, 4.2, 4.3) |
| OQ-02 | Open question | Which home-screen design ships: single-switch (Option A) or pre-drive checklist (Option B)? | PM / Design | Blocks Epic 2 (Stories 2.1a, 2.1b) |
| OQ-03 | Open question | What exact dB / audibility target must the alarm siren hit to be considered "loud enough" for QA sign-off? | Design / Hardware QA | Blocks Story 5.1 |
| OQ-04 | Open question | Is "delete my account and data" on the Settings screen the same flow as on the Privacy screen, or a separate confirmation path? | PM | Blocks Story 7.1, Story 8.2 |
| OQ-05 | Open question | Does legal/compliance need to review the PDPA claims (retention periods, breach-notification window, DPO contact) before this ships, given they're stated as binding commitments in-app? | Compliance | Blocks Story 8.2 |
| OQ-06 | Open question *(new)* | What are the numeric battery-drain and display-luminance targets for screen-off-mode QA sign-off? | Hardware QA | Blocks Epic 4 |
| OQ-07 | Open question *(new)* | What is the retention period for drive/drowsy-moment records prior to account deletion? | Compliance | Blocks Epic 8 |
| OQ-08 | Open question *(new)* | What are the target ship-date milestones for this initiative? | PM | Blocks overall planning |
| AS-01 | Assumption | Android-first, portrait only, dash-mounted at arm's length; all tap targets ≥56px | PM / Design | Validate at design lock |
| AS-02 | Assumption | Only one screen-off model ships eventually, though all three are documented as parallel candidate stories | PM / Design | Resolves with OQ-01 |
| AS-03 | Assumption | Home screen has two competing options, both documented pending decision | PM / Design | Resolves with OQ-02 |
| AS-04 | Assumption | Detection thresholds in `lib/detector.ts` are reused unchanged, remapped to 3 presets only — no new detection algorithm work in this initiative | Eng | Confirm at implementation kickoff |
| AS-05 | Assumption | Account creation is required even though on-device detection itself needs no account | PM | Confirm at implementation kickoff |
| AS-06 | Assumption | Backend is Supabase, Singapore region (`ap-southeast-1`) | Eng | Confirm at implementation kickoff |
| AS-07 | Assumption *(new)* | Driver tech fluency assumed Medium — no explicit persona research was supplied | PM | Validate with user research (see Section 3) |

---

## 14. Appendix

- **Related documents:** `docs/user-stories/play-store-redesign-flow.md` (full
  epics, FRs, and Given/When/Then acceptance criteria this PRD is derived from);
  Claude Design canvas "Vigil / Play Store redesign" (artifact `M2W21ZAYbjVW9ezBHJd2E7`).
- **Glossary:** EAR = Eye Aspect Ratio; MAR = Mouth Aspect Ratio (existing detector
  signals in `lib/detector.ts`); DND = Do Not Disturb; PDPA = Singapore's Personal
  Data Protection Act; PDPC = Personal Data Protection Commission (Singapore); DPO =
  Data Protection Officer; RLS = Row-Level Security.
