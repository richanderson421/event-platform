# Architecture Overview

## Bounded Areas
- **Identity/Auth**: email magic links for players + org members.
- **Organizations**: org creation, join requests, role/userType assignment.
- **Event Engine**: `events` base model + type configs (`league_configs`) for extensibility.
- **League Runtime**: periods, pairings, matches, reports/results.
- **Moderation/Admin**: global platform controls and event re-homing.
- **Audit + Notifications**: append-only audit logs and event bus abstraction.

## Extensible Event Engine
- `events.type` is the discriminator.
- Add future config tables (`swiss_config`, `single_elim_config`) without changing existing league flow.
- Pairing logic behind strategy interface (`lib/pairing/strategy.ts`) can be replaced per type.

## Standing/Scoring
- Default scoring: W=3, T=1, L=0 (editable only while event in `DRAFT`).
- BYE policy: one unpaired player receives BYE result and 1 point by default in standings service.

## Registration + Waitlist
- Registration respects `registration_mode`, `player_cap`, `waitlist_enabled`.
- Pending/approved/denied/waitlisted/dropped statuses are persisted per event/player.

## Match Reporting
- First player report creates/updates reporter record.
- If second report matches -> confirmed instantly.
- If second report disagrees/disputes -> `NEEDS_RESOLUTION`.
- If only one report after 5 minutes -> auto-confirm.

## Moderation Defaults
- Suspend: user remains in records but cannot moderate or operate events.
- Ban: user account blocked from login + participation.
