# Specification

## Summary
**Goal:** Fix Dashboard case card navigation and enrich each card with owner name and presenting complaint.

**Planned changes:**
- Fix the click handler on `CalendarCaseCard` so clicking a card sets `targetCaseId` in `App.tsx` and navigates to the Cases page, scrolling to and highlighting the corresponding case.
- Propagate the `onCaseClick` callback from `CalendarCaseCard` up through `DashboardPage` to `App.tsx` using the existing `targetCaseId` pattern.
- Display the owner name and presenting complaint on each `CalendarCaseCard`, in addition to the existing pet name, MRN, and species/sex fields.
- Gracefully omit owner name or presenting complaint if not available on a case.

**User-visible outcome:** Users can click any case card on the Dashboard calendar to be taken directly to that case on the Cases page, and each Dashboard card now also shows the owner name and presenting complaint.
