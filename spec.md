# SurgiCase

## Current State

- Calendar (Dashboard) page shows weekly appointments with species icons for canine/feline/other, interactive task badges, and completed appointment styling (green card).
- Cases page shows patient cards; each card has an Appointments section showing individual appointment rows with task lists.
- Completed appointments on the Cases page are supposed to collapse to a compact row (date + reason + green checkmark), expandable by clicking.
- Species icon PNGs in `/assets/generated/` (cat-icon.png, dog-icon.png, other-icon.png) were AI-generated placeholders that do not match the uploaded user icons.
- Task completion collapse on the Cases page is unreliable: checking the last task often does not trigger the visual collapse.

## Requested Changes (Diff)

### Add
- Nothing new.

### Modify
1. **Species icons**: Replace the AI-generated placeholder PNGs with the actual PNG data extracted from the user-uploaded ICO files (`Cat_Icon.ico`, `Dog_Icon.ico`, `Other_Species_Icon.ico`). The extraction has already been done at the filesystem level (new PNGs in `/assets/generated/`). The frontend code already references the correct paths — no code change needed for the path references, but the `AppointmentTaskList` and `CaseCard` components must reliably reference these files.
2. **Task completion collapse (Cases page)**: Refactor `AppointmentsSection` in `CaseCard.tsx` to eliminate the race between `locallyModifiedRef` and the seeding `useEffect`. The fix: initialize `localTaskOverrides` eagerly using a lazy state initializer (or a `useMemo`-seeded approach), remove the seeding `useEffect`, and update the override in-place on every toggle without relying on a ref guard. The `AppointmentTaskList` child should call `onTasksChange` synchronously on toggle, and the parent should derive `apptAllDone` purely from `localTaskOverrides`.

### Remove
- The seeding `useEffect` and `locallyModifiedRef` pattern in `AppointmentsSection` (replaced by a cleaner state initialization approach).

## Implementation Plan

1. **CaseCard.tsx** — Refactor `AppointmentsSection`:
   - Remove `locallyModifiedRef` and the seeding `useEffect`.
   - Initialize `localTaskOverrides` as a `Record<string, TaskStatus>` keyed by appointmentId string.
   - On mount/data load, merge server data into overrides only for keys NOT already present (so optimistic state is never overwritten). Use a `useEffect` that only adds missing keys — never overwrites existing ones.
   - Simplify: since `onTasksChange` is called before the async server call in `AppointmentTaskList`, the override is always set before any server round-trip. Just ensure no effect can overwrite it.
   - Cleanest approach: track a boolean `initializedRef` per appointment ID and seed only once.
   - Alternative cleaner approach: Lift task state fully into `AppointmentsSection` and make `AppointmentTaskList` fully controlled with no async cache interaction — use the `useQueryClient` in `AppointmentsSection` instead.

2. **AppointmentTaskList.tsx** — Make fully controlled:
   - Remove internal `pendingKeys` state if it interferes.
   - Keep `onTasksChange` as the immediate propagator.
   - After success, update the React Query cache for ONLY the specific query key `["appointments-by-mrn", mrn]` using `setQueryData` (not `setQueriesData`) to prevent unexpected re-renders in other subscribers.

3. **Verify** icons are correctly loaded (the PNG files were already replaced on disk).
