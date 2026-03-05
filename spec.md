# SurgiTrack

## Current State

The app has a Calendar page (DashboardPage) and a Cases page (CasesPage). Appointments carry a `TaskStatus` object where `false = task needs doing` and `true = task done/N/A`. Task badges are shown for "selected" tasks (those originally added to the appointment) on both pages.

### Known issues
1. **Edit appointment task changes don't persist visually**: When an appointment is edited to add/remove tasks, the `AppointmentsSection` in `CaseCard` has a `seededRef` that locks in task state from the first server fetch. After `useUpdateAppointment` invalidates the `appointments-by-mrn` query and fresh server data arrives, the `seededRef` blocks re-seeding — so the new task selection is silently discarded and the old icons remain.
2. The same lock-in also affects the Calendar page's `AppointmentTaskBadges`, which reads directly from the `appointments` query cache. After an edit the cache is correctly invalidated and re-fetched, so the Calendar page actually does update — but the visible task icons rely on the `pendingTasks` filter (`!tasks[key]`). If the saved task has `true` (N/A) it disappears; if `false` (needs doing) it reappears. This part works, but the Dashboard uses stale `appointment` props because `AppointmentCard` receives a prop snapshot. Once the query cache updates, React Query re-renders the parent and a new prop flows down — this should work, but needs verification.
3. App name shows "SurgiCase" in the header and footer.
4. No refresh button exists on any page.

## Requested Changes (Diff)

### Add
- Refresh button in the Dashboard page header toolbar (next to "Add Appointment"), which calls `queryClient.invalidateQueries` for `["appointments"]` and `["appointments-by-mrn"]`.
- Refresh button in the Cases page header toolbar, which calls `queryClient.invalidateQueries` for `["cases"]`, `["appointments"]`, and `["appointments-by-mrn"]`.

### Modify
- **Header.tsx**: Change "SurgiCase" text to "SurgiTrack". Change `alt` attribute of logo image to "SurgiTrack".
- **App.tsx**: Change loading spinner label "Loading SurgiCase..." to "Loading SurgiTrack..." and footer copyright text from "SurgiCase" to "SurgiTrack".
- **CaseCard.tsx / AppointmentsSection**: After `useUpdateAppointment` succeeds, the query cache is invalidated and a new fetch fires. The `seededRef` must be cleared for the edited appointment so the fresh server data re-seeds the local task overrides. Fix: after `EditAppointmentForm` calls `onSuccess`, clear the seededRef entry for that appointment ID and delete its entry from `localTaskOverrides` so the re-fetch re-seeds cleanly.
- **AppointmentsSection**: Expose a way for the parent (`AppointmentsSection`) to reset a single appointment's seed when its edit form succeeds. The `EditAppointmentForm`'s `onSuccess` callback should trigger this reset.
- **AppointmentTaskList**: The `selectedKeys` state is computed once on mount from `tasks`. After an edit, the component is unmounted and remounted (because `EditAppointmentForm` closes and `AppointmentsSection` re-renders), so `selectedKeys` re-initialises from the new server tasks — this is already correct behaviour as long as the `localTaskOverrides` are cleared correctly in the parent.

### Remove
- Nothing removed.

## Implementation Plan

1. **Header.tsx** — change "SurgiCase" → "SurgiTrack" in span text and img alt.
2. **App.tsx** — change both "SurgiCase" string occurrences (loading spinner text, footer) to "SurgiTrack".
3. **DashboardPage.tsx** — add a Refresh icon button to the page-header toolbar; on click call `queryClient.invalidateQueries({ queryKey: ["appointments"] })`.
4. **CasesPage.tsx** — add a Refresh icon button to the page-header toolbar; on click invalidate `["cases"]`, `["appointments"]`, `["appointments-by-mrn"]`.
5. **CaseCard.tsx / AppointmentsSection** — when the `EditAppointmentForm` `onSuccess` fires for a given appointment, clear that appointment's entry from `seededRef` and `localTaskOverrides` so the fresh server data can re-seed it with the correct updated tasks.
