# Vigil — Play Store Redesign: User Stories

Product: Vigil
Workflow: Onboarding → monitored drive → post-drive review (Play Store / redesign)
Version: 1.0 — Draft
Prepared by: Product (via User Story Creator skill)
Date: 2026-09-18
Actors: Driver
Domain context: Generic consumer mobile app (Android), with a Singapore PDPA data-privacy overlay applied wherever camera frames, biometric-adjacent signals, or account data are touched

Source: Claude Design canvas "Vigil / Play Store redesign" (artifact `M2W21ZAYbjVW9ezBHJd2E7`), a redesign proposal for the existing app that (1) hides technical/ML detector internals behind plain-English states, (2) supports screen-off driving, and (3) meets Google Play's prominent-disclosure requirement plus Singapore PDPA obligations.

---

## Assumptions

1. **Android-first, portrait only, dash-mounted at arm's length.** All tap targets are ≥56px. Affects every story below. *(Source: design brief)*
2. **Only one screen-off model ships** — the design presents three alternatives (pocket mode, notification-as-interface, dim dash face) without picking one. Epic 4 below writes all three as parallel stories; see Open Questions.
3. **Home screen has two competing options** (one-switch vs. pre-drive checklist) — not resolved in the source design. Epic 2 writes both; see Open Questions.
4. **Detection thresholds already exist** in `lib/detector.ts` (EAR/MAR + head-pitch based). This redesign assumes that logic is reused unchanged and only remapped to three named presets (Relaxed/Standard/Strict) — no new detection algorithm work.
5. **Account creation is still required** even though on-device detection itself needs no account — affects Epic 1, Story 1.3.
6. **Backend is Supabase, Singapore region (ap-southeast-1)**, per the privacy policy screen — affects Epic 8 dependencies.

---

## Epic 1: Onboarding & consent

> **Epic goal:** Let a first-time driver understand what Vigil does, grant camera access with full disclosure, and create or sign into an account.

```
STORY 1.1: First-time onboarding value proposition
Epic: Onboarding & consent
─────────────────────────────────────────

USER STORY
As a driver opening Vigil for the first time, I want to see what the app does and why it needs my camera, so that I can decide whether to continue before any permission prompt appears.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall display an onboarding screen before requesting any device permission.
2. The system shall state, in plain language, that Vigil watches for closing eyes, yawns, and a nodding head.
3. The system shall list that the app works with the screen off, that nothing is recorded, and that alerts use siren + voice + vibration together.
4. The system shall display an assistive-tool disclaimer ("not a substitute for rest") that cannot be dismissed without being read (i.e., is visible on the primary screen, not hidden behind a link).
5. The system shall provide a "Get started" primary action and an "I already have an account" secondary action.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given a driver has never opened Vigil, When the app launches, Then the onboarding screen is the first screen shown, before any OS permission dialog.
- Given the driver taps "Get started", When the tap registers, Then the system proceeds to the prominent camera disclosure (Story 1.2), not directly to the OS permission dialog.
- Given the driver taps "I already have an account", When the tap registers, Then the system navigates to sign-in (Story 1.3) with the "Sign in" tab pre-selected.

─────────────────────────────────────────
SUCCESS METRICS
[ ] 100% of first-time launches show onboarding before any permission dialog fires
[ ] 0 crash reports tied to onboarding-to-permission-flow transition in first release week

─────────────────────────────────────────
DEPENDENCIES
- System: None (entry point of the app)
- Prior story: None — this is the workflow's trigger screen
```

```
STORY 1.2: Prominent disclosure before background camera permission
Epic: Onboarding & consent
─────────────────────────────────────────

USER STORY
As a driver, I want to be clearly told that Vigil uses my camera in the background — including with my screen off — and what happens to that footage, before the system permission prompt appears, so that I can give informed consent rather than reflexively tapping "Allow."

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall display a dedicated disclosure screen naming background camera use explicitly, before triggering the native OS camera-permission dialog.
2. The system shall state that images are read on-device and discarded instantly, that no video/photo is recorded, saved, or uploaded, and that a persistent notification will show whenever the camera is active.
3. The system shall provide both an "Allow camera" action (which then triggers the OS permission prompt) and a "Not now" action that returns the driver to a state without granting permission.
4. The system shall provide a link to the full privacy policy (Story 8.2) from this screen.
5. If the driver selects "Not now," the system shall not request camera permission and shall leave core drowsiness detection unavailable until disclosure is re-shown and accepted.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given the driver taps "Get started" from onboarding, When the disclosure screen renders, Then the OS camera-permission dialog has not yet been triggered.
- Given the driver taps "Allow camera", When the tap registers, Then the OS permission dialog appears next.
- Given the driver taps "Not now", When the tap registers, Then no OS permission dialog appears and the driver is returned to a state where detection features are inaccessible.
- Given the OS permission dialog appears, When the driver denies it at the OS level (after having tapped "Allow camera" here), Then the app shall not crash and shall surface a way to retry disclosure later (e.g., from Settings).

─────────────────────────────────────────
SUCCESS METRICS
[ ] 100% of camera-permission requests are preceded by this disclosure screen (verified via analytics event ordering)
[ ] "Not now" is a fully functional dead-end with no forced re-prompt loop

─────────────────────────────────────────
DEPENDENCIES
- Prior story: 1.1 (onboarding) must be complete or the driver must have selected "I already have an account" and reached a point requiring camera access
- System: Android OS camera permission API

─────────────────────────────────────────
TECHNICAL / COMPLIANCE NOTES
This satisfies the Google Play prominent-disclosure requirement for background location/camera-adjacent sensitive permissions: disclosure must be shown in-app, before the OS prompt, and must name the background behaviour explicitly. Do not rely on the OS permission dialog's own text to satisfy this — Play policy treats that as insufficient on its own.
```

```
STORY 1.3: Sign in or create an account
Epic: Onboarding & consent
─────────────────────────────────────────

USER STORY
As a driver, I want to sign in or create an account using Google or e-mail, so that my drive history is preserved if I change phones — while understanding that drowsiness detection itself works without one.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall present a segmented control to switch between "Sign in" and "Create account" modes on a single screen.
2. The system shall offer "Continue with Google" as the primary authentication method, with e-mail/password as a secondary path.
3. The system shall require a Name field only in create-account mode.
4. The system shall display explanatory copy stating that an account preserves trip history across devices and that detection itself runs offline.
5. If authentication fails (wrong credentials, network error), the system shall display an inline, specific error and shall not silently fail.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given a driver on the sign-in screen, When they tap "Create account", Then a Name field appears above the E-mail field and the primary button label changes to "CREATE ACCOUNT".
- Given valid Google credentials, When the driver taps "Continue with Google", Then they are signed in and routed to the pre-drive/home screen (Epic 2).
- Given an incorrect password, When the driver submits, Then an inline error message appears without navigating away from the screen.
- Given no network connectivity, When the driver submits any auth method, Then the system displays a network-error message distinct from a credentials error.

─────────────────────────────────────────
SUCCESS METRICS
[ ] Authentication errors always render inline within 3 seconds of submission
[ ] 0 instances of a silent auth failure (no feedback shown) in QA pass

─────────────────────────────────────────
DEPENDENCIES
- Data: None
- System: Google OAuth provider; Supabase (or equivalent) auth backend
- Prior story: 1.1 or 1.2, depending on entry path
```

---

## Epic 2: Pre-drive readiness & start

> **Epic goal:** Let a signed-in driver confirm the app is ready to monitor them and start a watching session. **Two competing designs exist for this screen — see Open Questions.**

```
STORY 2.1a: Home (Option A) — single switch with sensitivity presets
Epic: Pre-drive readiness & start
─────────────────────────────────────────

USER STORY
As a driver about to start a trip, I want one clear "start watching" action and a plain-English readiness state, so that I don't have to interpret technical status before driving.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall display a single readiness word ("READY") with one supporting sentence, with no numeric detector readouts.
2. The system shall display exactly one primary action: "START WATCHING".
3. The system shall provide a 3-way sensitivity selector (Relaxed / Standard / Strict) with a one-sentence, plain-English consequence for the selected option, and no numeric thresholds shown.
4. The system shall provide a "screen off while watching" toggle.
5. The system shall display the outcome of the driver's most recent drive (duration + one-line outcome) with a link to full history.
6. If the driver's face is not detectable at all (e.g., camera obstructed) when this screen loads, the system shall not display "READY" and shall instead state what is blocking readiness.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given camera permission is granted and a face is detected, When the home screen loads, Then it displays "READY" and an enabled "START WATCHING" button.
- Given the driver taps a sensitivity option, When the tap registers, Then the selected option is visually highlighted and its plain-English description updates immediately.
- Given the driver taps "START WATCHING", When the tap registers, Then the system transitions to the active-monitoring screen (Epic 3).
- Given no face is detected in the camera preview, When the home screen loads, Then "READY" is not shown and "START WATCHING" is disabled or explains why.

─────────────────────────────────────────
SUCCESS METRICS
[ ] Sensitivity selection updates its description text within 100ms of tap
[ ] "START WATCHING" is never enabled while readiness preconditions (camera permission + face detected) are unmet

─────────────────────────────────────────
DEPENDENCIES
- Prior story: 1.2 (camera permission), 1.3 (signed in)
- System: `lib/detector.ts` face-detection availability signal, remapped from existing EAR/MAR thresholds to the 3 presets
```

```
STORY 2.1b: Home (Option B) — pre-drive checklist
Epic: Pre-drive readiness & start
─────────────────────────────────────────

USER STORY
As a driver about to start a trip, I want to be walked through the specific conditions that make detection actually work (phone mounted, face visible, volume up), so that I don't start a drive Vigil can't reliably monitor.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall present exactly three checklist items: phone mounted facing the driver, face in view, and device volume audible.
2. The system shall auto-detect and check off items 1 and 2 where technically possible (camera-based face visibility) and shall require manual confirmation for item 3 (volume) via a "FIX" action that deep-links to volume controls.
3. The system shall display the current sensitivity preset with a "Change" link to Settings (Story 7.1), rather than inline selection.
4. The system shall gate the "START WATCHING" action visually (e.g., disabled/greyed) until all three checklist items are satisfied.
5. Once gated conditions are met, the system shall enable "START WATCHING" without requiring an additional confirmation step.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given the phone is mounted and a face is visible but volume is at a level too low to be heard over road noise, When the checklist renders, Then items 1–2 show as complete and item 3 shows a "FIX" affordance, and "START WATCHING" remains disabled.
- Given all three items are satisfied, When the checklist re-evaluates, Then "START WATCHING" becomes enabled without further driver action.
- Given the driver taps "FIX" on the volume item, When the tap registers, Then the system opens the device volume control (or in-app equivalent) and re-checks the item on return.

─────────────────────────────────────────
SUCCESS METRICS
[ ] Checklist state re-evaluates within 1 second of any underlying condition changing (camera view, volume level)
[ ] 0 instances of "START WATCHING" being reachable while any checklist item is unmet

─────────────────────────────────────────
DEPENDENCIES
- Prior story: 1.2, 1.3
- System: device volume API, camera face-visibility signal
```

---

## Epic 3: Active monitoring — screen on

> **Epic goal:** Show the driver their current alertness state in plain language while the screen stays on, replacing the old technical dashboard entirely.

```
STORY 3.1: Live status while screen is on
Epic: Active monitoring — screen on
─────────────────────────────────────────

USER STORY
As a driver mid-drive with the screen on, I want to see one word describing how I look and one supporting sentence, so that I get a clear read without being distracted by technical detail.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall display exactly one status word (e.g., "ALERT") derived from current detector state, with no visible counters, event logs, or numeric readouts.
2. The system shall display a live camera preview labeled "Preview only — nothing is recorded" and shall never persist any frame from this preview.
3. The system shall display elapsed watching duration in the supporting sentence.
4. The system shall provide a "Turn the screen off" action and a "Stop watching" action.
5. The system shall update the status word within the same latency bound as the underlying detector signal (no added debounce beyond what already exists in `lib/detector.ts`).

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given the driver's eyes are open and head is steady, When the detector reports an alert state, Then the screen displays "ALERT" and a sentence naming the elapsed duration.
- Given the driver taps "Stop watching", When the tap registers, Then the system ends the session and transitions to the post-drive summary (Story 6.1).
- Given the driver taps "Turn the screen off", When the tap registers, Then the system transitions to the currently-shipped screen-off experience (Epic 4) without ending the watching session.
- Given the camera feed is interrupted (e.g., app briefly backgrounded by an incoming call), When the feed resumes, Then the preview resumes without restarting the elapsed-duration counter.

─────────────────────────────────────────
SUCCESS METRICS
[ ] No numeric detector values (EAR/MAR scores, event counts) are rendered anywhere on this screen
[ ] Status word updates visibly within 1 second of an underlying detector state change

─────────────────────────────────────────
DEPENDENCIES
- Prior story: 2.1a or 2.1b ("START WATCHING" tapped)
- System: `lib/detector.ts` real-time state stream
```

---

## Epic 4: Active monitoring — screen off

> **Epic goal:** Let the driver keep Vigil watching with the screen off, without draining battery or creating night-time glare. **Three competing designs exist — see Open Questions; only one is expected to ship.**

```
STORY 4.1: Screen-off model — pocket mode
Epic: Active monitoring — screen off
─────────────────────────────────────────

USER STORY
As a driver who has turned the screen off, I want a near-black display with a single breathing indicator, so that I have visual confirmation Vigil is still watching without any glare or exposed detail.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall render a near-black screen with one pulsing indicator dot and the word "WATCHING" while screen-off mode is active.
2. The system shall expand to a status overlay (current alertness state, elapsed time, "Keep watching" / "Stop" actions) when the driver taps anywhere on the screen.
3. The system shall automatically collapse the status overlay back to the near-black state after a fixed idle period (approx. 8 seconds, per design copy).
4. The system shall continue drowsiness detection and alarm triggering (Epic 5) regardless of whether the overlay is expanded or collapsed.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given screen-off mode is active and collapsed, When the driver taps the screen, Then the overlay expands showing current status and elapsed time within 300ms.
- Given the overlay is expanded and the driver takes no action, When 8 seconds elapse, Then the overlay collapses back to the near-black state automatically.
- Given the overlay is expanded, When the driver taps "Stop", Then the watching session ends and the system transitions to the post-drive summary (Story 6.1).
- Given a drowsy state is detected while collapsed, When the threshold for alarm is crossed, Then the alarm (Epic 5) fires regardless of overlay state.

─────────────────────────────────────────
SUCCESS METRICS
[ ] Measured display luminance in collapsed state stays below a defined low-glare threshold (device-dependent; QA to confirm target value)
[ ] Overlay expand latency ≤300ms on tap in 95% of trials

─────────────────────────────────────────
DEPENDENCIES
- Prior story: 3.1 ("Turn the screen off" tapped) or direct entry if screen-off is default
- System: Android foreground service (required to keep camera active with screen off)
```

```
STORY 4.2: Screen-off model — notification as interface
Epic: Active monitoring — screen off
─────────────────────────────────────────

USER STORY
As a driver with the screen locked, I want the required persistent notification to double as my status display, so that I can check on and control Vigil from the lock screen without a separate UI.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall surface an ongoing, non-dismissible-by-swipe notification while screen-off watching is active, as required for an Android foreground service.
2. The notification shall display current status ("Watching you — you look alert"), elapsed duration, and a one-line explanation that the camera is running with the screen off.
3. The notification shall provide "PAUSE" and "STOP" actions directly on the notification.
4. The system shall state, either in the notification or adjacent lock-screen copy, that unlocking the phone does not stop Vigil.
5. If the driver taps "STOP" on the notification, the system shall end the watching session and route to the post-drive summary (Story 6.1) on next app open.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given screen-off watching is active, When the driver views the lock screen, Then the persistent notification is visible and cannot be swiped away while watching is active.
- Given the driver taps "STOP" on the notification, When the tap registers, Then the watching session ends immediately, even if the app is not reopened.
- Given the driver taps "PAUSE" on the notification, When the tap registers, Then detection pauses and the notification updates to reflect a paused state without ending the session outright.
- Given a drowsy state is detected, When the alarm threshold is crossed, Then the alarm (Epic 5) is still able to take over the foreground/lock screen despite the phone being locked.

─────────────────────────────────────────
SUCCESS METRICS
[ ] Notification is present for 100% of screen-off watching duration (verified against foreground-service lifecycle logs)
[ ] STOP action from the notification ends the session with no more than 1 second of latency

─────────────────────────────────────────
DEPENDENCIES
- System: Android foreground service notification (required by OS, not optional) — this model reuses the mandatory notification rather than adding a second one
- Prior story: 3.1 or direct screen-off entry

─────────────────────────────────────────
TECHNICAL / COMPLIANCE NOTES
Android requires a foreground-service notification for any background camera use; this design uses that mandatory notification as the primary interface rather than building a redundant one. Confirm notification-channel importance level allows action buttons on target Android versions.
```

```
STORY 4.3: Screen-off model — low-power dash face
Epic: Active monitoring — screen off
─────────────────────────────────────────

USER STORY
As a driver with the phone mounted on my dash, I want the screen to dim into a clock face rather than go fully dark, so that a mounted phone still tells me the time without glaring at night.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall render a dimmed clock display showing current time, watching status, elapsed duration, and a count of drowsy moments so far.
2. The system shall keep display brightness at a reduced "dimmed" level throughout, brightening only when the alarm (Epic 5) needs to take over.
3. The system shall provide a "Stop watching" action reachable from this screen.
4. The system shall continue to update elapsed time and drowsy-moment count live without requiring driver interaction.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given screen-off (dash-face) mode is active, When a drowsy moment is detected, Then the "DROWSY MOMENTS" counter increments in place without a full-brightness flash.
- Given the alarm threshold is crossed, When the alarm fires, Then the display brightens to full alarm state (Story 5.1) regardless of the current dimmed level.
- Given the driver taps "Stop watching", When the tap registers, Then the session ends and the system transitions to the post-drive summary (Story 6.1).

─────────────────────────────────────────
SUCCESS METRICS
[ ] Display brightness remains at the defined dimmed level for the full session except during an active alarm
[ ] Drowsy-moment counter and clock update without any driver interaction required

─────────────────────────────────────────
DEPENDENCIES
- System: Android foreground service; device brightness control API
- Prior story: 3.1 or direct screen-off entry
```

---

## Epic 5: Drowsiness alarm

> **Epic goal:** Wake a drowsy driver decisively and safely, and require a deliberate action to dismiss so it can't be silenced half-asleep.

```
STORY 5.1: Trigger and dismiss the wake alarm
Epic: Drowsiness alarm
─────────────────────────────────────────

USER STORY
As a driver whose eyes have been closed longer than the safe threshold, I want a full-screen, multi-channel alarm that requires two deliberate taps to dismiss, so that I am actually woken and cannot silence it reflexively while still drowsy.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall take over the full screen with a high-contrast alarm state when the drowsiness threshold (per the active sensitivity preset) is crossed, regardless of current screen-on/screen-off state.
2. The system shall simultaneously trigger spoken audio, a siren, and device vibration.
3. The system shall display the instruction "Pull over as soon as it is safe" and a supporting sentence naming the cause (eyes closed longer than expected).
4. The system shall require exactly two sequential taps on the dismiss control to silence the alarm: the first tap shall change the control's label/state without silencing; only the second tap shall stop the siren/vibration/voice.
5. The system shall log the alarm event (timestamp, cause category) to the driver's drive record regardless of how quickly it is dismissed.
6. The alarm shall override Do Not Disturb / silent mode so audio and vibration are audible even if the device is muted.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given the drowsiness threshold is crossed under the active preset, When the alarm triggers, Then siren, spoken audio, and vibration all start within the same detection cycle, and the display takes over full-screen regardless of prior screen-off state.
- Given the alarm is active, When the driver taps the dismiss control once, Then the control's label changes to confirm intent but audio/vibration continue.
- Given the control has been tapped once, When the driver taps it again, Then all alarm channels stop immediately.
- Given the driver puts the phone in a pocket or the screen is otherwise obstructed during an active alarm, When obstruction is detected, Then audio and vibration continue uninterrupted (visual dismissal is not the only channel).
- Given an alarm event occurs, When it is later reviewed in the post-drive summary (Story 6.1), Then its timestamp and cause are present in the drive's timeline.

─────────────────────────────────────────
SUCCESS METRICS
[ ] 100% of alarm triggers activate all three channels (audio, siren, vibration) simultaneously
[ ] 0% of alarms are dismissible via a single tap in QA testing
[ ] Alarm audio is measured audible above typical in-cabin road/music noise (target dB to be confirmed with hardware QA)

─────────────────────────────────────────
DEPENDENCIES
- System: `lib/detector.ts` threshold-crossing signal; device audio/vibration APIs; Do Not Disturb override permission
- Prior story: Any active watching state (Epic 3 or Epic 4)

─────────────────────────────────────────
TECHNICAL / COMPLIANCE NOTES
This is the safety-critical path of the entire app — prioritize for the most rigorous QA and device-fragmentation testing (audio focus handling across OEMs, vibration availability, DND override permission grants).
```

---

## Epic 6: Post-drive summary & history

> **Epic goal:** Let the driver understand how a completed drive went and spot patterns across drives over time.

```
STORY 6.1: Post-drive summary
Epic: Post-drive summary & history
─────────────────────────────────────────

USER STORY
As a driver who just finished a monitored drive, I want one score and one sentence summarizing how alert I was, so that I get a fast, meaningful read without parsing raw counters.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall display drive duration, a single 0–100 alertness score, and a one-sentence plain-language summary.
2. The system shall display a timeline strip of the drive marking alert, yawning, and alarm periods with distinct visual treatment.
3. The system shall display a contextual tip when applicable (e.g., a break-frequency suggestion after long drives with alarms).
4. The system shall provide a "DONE" action that returns the driver to the home/readiness screen (Epic 2).
5. The system shall NOT display the previous six raw counters (eye events, nods, etc.) that existed in the prior UI.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given a drive ends (via "Stop watching" from any active-monitoring screen), When the summary screen renders, Then it shows duration, score, and summary sentence without any raw event counters.
- Given the drive included at least one alarm event, When the timeline strip renders, Then that period is visually distinguished (e.g., color) from alert and yawning periods.
- Given the driver taps "DONE", When the tap registers, Then the system returns to the home/readiness screen and the completed drive is persisted to history (Story 6.2).

─────────────────────────────────────────
SUCCESS METRICS
[ ] Alertness score is computed and displayed within 2 seconds of drive end
[ ] 0 raw detector counters (EAR/MAR values, nod counts) appear anywhere on this screen

─────────────────────────────────────────
DEPENDENCIES
- Prior story: 3.1 / 4.1 / 4.2 / 4.3 ("Stop watching" triggered), 5.1 (if any alarms occurred)
- Data: Drive record with timestamped events must exist before this screen renders
```

```
STORY 6.2: Drive history and weekly pattern
Epic: Post-drive summary & history
─────────────────────────────────────────

USER STORY
As a driver with multiple recorded drives, I want to see when during the day and week I'm most at risk, so that the pattern — not just a list of past trips — changes how I plan drives.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall display a weekly risk-by-time-of-day chart derived from the driver's own historical drowsy-moment timestamps.
2. The system shall display a chronological list of recent drives, each showing its alertness score, date/duration, and a one-line outcome summary.
3. The system shall require a minimum data threshold (e.g., at least one completed drive) before rendering the pattern chart; with zero drives, the system shall show an empty state rather than a chart with no data.
4. The system shall display a disclaimer that scores are a rough behavioural guide, not a medical measurement.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given the driver has completed at least one drive, When the history screen loads, Then both the pattern chart and the recent-drives list render with real data.
- Given the driver has zero completed drives, When the history screen loads, Then an empty state is shown instead of an empty or misleading chart.
- Given a drive included an alarm, When it appears in the recent-drives list, Then its outcome line reflects that (e.g., "Three alarms — you were very tired").

─────────────────────────────────────────
SUCCESS METRICS
[ ] Pattern chart accurately reflects 100% of the driver's own historical drowsy-moment timestamps (no cross-user data)
[ ] Empty state is shown for any account with 0 completed drives, verified in QA

─────────────────────────────────────────
DEPENDENCIES
- Data: At least one completed, persisted drive record
- Prior story: 6.1 (drives must be persisted after completion)
```

---

## Epic 7: Settings & alert preferences

> **Epic goal:** Let the driver adjust how sensitive and how loud Vigil is, and manage basic account actions, without exposing any raw detector thresholds.

```
STORY 7.1: Adjust sensitivity and alert channels
Epic: Settings & alert preferences
─────────────────────────────────────────

USER STORY
As a driver, I want to change how quickly Vigil wakes me and which alert channels it uses, so that I can tune it to my driving conditions (e.g., city vs. night motorway) without needing to understand the underlying detection thresholds.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall provide the same 3-way sensitivity selector (Relaxed / Standard / Strict) available from the home screen, with identical plain-English descriptions.
2. The system shall provide independent toggles for spoken warning, siren, and vibration alert channels.
3. The system shall provide a "watch with screen off" toggle consistent with the state used in Epic 2/4.
4. The system shall display the signed-in account e-mail and provide "Sign out" as a distinct action from account deletion (Story 8.2).
5. The system shall never display a numeric threshold value (seconds, EAR/MAR scores) anywhere on this screen.
6. Changes made here shall immediately apply to the next watching session without requiring an app restart.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given the driver changes sensitivity from Standard to Strict in Settings, When they next start a watching session, Then the Strict threshold behavior is active without any additional confirmation step.
- Given the driver disables the siren toggle, When an alarm subsequently triggers, Then audio warning and vibration still fire but the siren channel does not.
- Given the driver taps "Sign out", When the tap registers, Then their session ends and they are returned to the sign-in screen (Story 1.3), with local drive history not deleted from the backend.
- Given the driver disables all three alert channels simultaneously, When they attempt to save, Then the system shall prevent this state or warn that no alert channel would fire during an alarm (safety-critical edge case).

─────────────────────────────────────────
SUCCESS METRICS
[ ] Sensitivity and channel changes apply to the very next session with 0 required restarts
[ ] It is impossible to reach a state with 0 active alert channels without an explicit warning

─────────────────────────────────────────
DEPENDENCIES
- Prior story: 1.3 (signed in)
- System: Shared preset/preference store also read by Epic 2 and Epic 5
```

---

## Epic 8: Privacy, data safety & PDPA compliance

> **Epic goal:** Give the driver a clear, in-app account of what data is and isn't collected, and let them exercise PDPA rights (access, correction, consent withdrawal, deletion) without contacting support.

```
STORY 8.1: View data safety summary
Epic: Privacy, data safety & PDPA compliance
─────────────────────────────────────────

USER STORY
As a driver, I want a short, plain-language summary of what never leaves my phone versus what is saved to my account, so that I can quickly understand my privacy exposure without reading a full legal policy.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall display two distinct lists: data that never leaves the device (camera images, face data, audio) and data saved to the account (e-mail, name, drive start/end times, drowsy-moment occurrences).
2. The system shall state explicitly that camera images are read frame-by-frame and discarded, with no face template stored.
3. The system shall provide "Download my data" and "Delete my account and data" actions on this screen.
4. The system shall link to the full privacy policy (Story 8.2) from this screen.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given the driver opens this screen, When it renders, Then both lists (never-leaves-phone vs. saved-to-account) are visible without scrolling past the fold on a standard device, or clearly labeled if scrolling is required.
- Given the driver taps "Download my data", When the request is submitted, Then the system confirms the request was received (per PDPA's response-time obligation, detailed in Story 8.2).
- Given the driver taps "Delete my account and data", When the tap registers, Then the system routes to the confirmation flow in Story 8.2 rather than deleting immediately.

─────────────────────────────────────────
SUCCESS METRICS
[ ] 100% of data categories listed here match what is actually collected per the technical implementation (verified against backend schema)
[ ] 0 discrepancies between this screen's claims and the full privacy policy (Story 8.2)

─────────────────────────────────────────
DEPENDENCIES
- Prior story: 1.3 (signed in)
- System: Data export/deletion pipeline
```

```
STORY 8.2: Withdraw consent and delete account & data
Epic: Privacy, data safety & PDPA compliance
─────────────────────────────────────────

USER STORY
As a driver, I want to withdraw my consent and delete my account and all associated data at any time, for any reason, without being penalized or forced to explain myself, so that I retain full control over my personal data as required under Singapore's PDPA.

─────────────────────────────────────────
FUNCTIONAL REQUIREMENTS
1. The system shall provide a full privacy policy screen covering: what is collected, why, consent and withdrawal, retention periods per data category, storage location and cross-border transfer terms, security measures, access/correction rights, and a named Data Protection Officer contact.
2. The system shall provide a "Withdraw consent and delete everything" action that does not require the driver to provide a reason.
3. The system shall inform the driver, before final confirmation, what functionality stops working as a result (drowsiness detection) as part of the withdrawal flow.
4. The system shall complete account and data erasure within 30 days of a confirmed deletion request, including from backups, per the stated retention policy.
5. The system shall provide "Request a copy of my data" and "Correct my details" actions, and shall respond to such requests within 30 days, or shall communicate a reason and revised timeline if unable to meet it.
6. The system shall not refuse a consent-withdrawal or deletion request without stating the specific legal ground for refusal, if refused.

─────────────────────────────────────────
ACCEPTANCE CRITERIA
- Given the driver taps "Withdraw consent and delete everything", When the confirmation step renders, Then it states plainly that drowsiness detection will stop and that this cannot be undone, before requiring a final confirming tap.
- Given the driver confirms deletion, When the request is processed, Then account and personal data are fully erased within 30 days, including from backup copies.
- Given the driver submits "Request a copy of my data", When 30 days pass without fulfillment, Then the system (or its operating process) must have communicated a reason and revised timeline to the driver.
- Given a data breach affecting personal data occurs, When it is assessed as notifiable, Then it is reported to the PDPC and to affected drivers within 3 calendar days of that assessment (process requirement, not purely UI).

─────────────────────────────────────────
SUCCESS METRICS
[ ] 100% of deletion requests are fully erased (including backups) within the 30-day window
[ ] 0 deletion or consent-withdrawal requests are refused without a stated legal ground
[ ] Data-subject access/correction requests receive a response within 30 days, tracked per request

─────────────────────────────────────────
DEPENDENCIES
- System: Supabase backend (Singapore, ap-southeast-1 region) with row-level security; backup deletion pipeline capable of honoring erasure within 30 days
- Prior story: 8.1

─────────────────────────────────────────
TECHNICAL / COMPLIANCE NOTES
This story encodes explicit Singapore PDPA obligations from the source design: purpose limitation (no advertising/profiling use, no sale/share of data), the transfer-limitation obligation for any sub-processor outside Singapore, TLS 1.2+/AES-256 encryption requirements, and the 3-calendar-day notifiable-breach reporting window to the PDPC. Legal/compliance sign-off is strongly recommended before this story is considered done, not just engineering QA.
```

---

## Out of scope

| Item | Reason out of scope | Revisit trigger |
|---|---|---|
| iOS-specific onboarding/permission flows | Design brief states "Android first"; iOS camera-permission and background-service models differ substantially | If/when iOS support is prioritized |
| Detection algorithm/threshold tuning itself (`lib/detector.ts` internals) | Redesign only remaps existing thresholds to 3 presets; the ML/CV logic is unchanged | If detection accuracy issues are reported separately from this UI redesign |
| Google Play Store listing assets (screenshots, description copy) | Explicitly flagged as a "try next" item in the source design, not part of the in-app workflow | When preparing the actual Play Store submission |
| Multi-driver / shared-device support | No such actor or flow appears anywhere in the design | If a household/shared-vehicle use case is proposed |
| The "drowsy-but-not-yet-alarming" intermediate state | Explicitly flagged as unshown in the source design ("try next" list) | If product wants a pre-alarm warning state between ALERT and the full alarm |

## Open questions

| # | Question | Owner | Blocking which story? |
|---|---|---|---|
| 1 | Which screen-off model ships: pocket mode, notification-as-interface, or dim dash face — or should all three be user-selectable? | PM / Design | Epic 4 (Stories 4.1, 4.2, 4.3) |
| 2 | Which home-screen design ships: single-switch (Option A) or pre-drive checklist (Option B)? | PM / Design | Epic 2 (Stories 2.1a, 2.1b) |
| 3 | What exact dB / audibility target must the alarm siren hit to be considered "loud enough" for QA sign-off? | Design / Hardware QA | Story 5.1 |
| 4 | Is the "delete my account and data" action on the Settings screen (1m) the same flow as the one on the Privacy screen (1n/1o), or a separate confirmation path? | PM | Story 7.1, Story 8.2 |
| 5 | Does legal/compliance need to review the PDPA claims (retention periods, breach-notification window, DPO contact) before this ships, given they're stated as binding commitments in-app? | Compliance | Story 8.2 |
