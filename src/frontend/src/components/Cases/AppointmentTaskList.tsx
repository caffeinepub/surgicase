import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useActor } from "../../hooks/useActor";
import type { TaskKey, TaskStatus } from "../../types/case";
import TaskBadge from "./TaskBadge";

// All possible task keys — we determine which to display based on initial task state
const ALL_TASK_KEYS: TaskKey[] = [
  "dischargeNotes",
  "pDVMNotified",
  "labs",
  "histo",
  "surgeryReport",
  "imaging",
  "culture",
  "dailySummary",
];

interface AppointmentTaskListProps {
  appointmentId: bigint;
  mrn: string;
  // tasks is the authoritative value — managed by the parent via onTasksChange
  tasks: TaskStatus;
  onTasksChange?: (updated: TaskStatus) => void;
}

export default function AppointmentTaskList({
  appointmentId,
  mrn,
  tasks,
  onTasksChange,
}: AppointmentTaskListProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  // Track which individual tasks are currently being saved to the server
  const [pendingKeys, setPendingKeys] = useState<Set<TaskKey>>(new Set());

  // visibleKeys: the set of tasks to display.
  // For new appointments: unselected tasks are stored as true (N/A), selected as false.
  //   → show tasks where initial value = false.
  // For old appointments (pre-fix): tasks may all be false → show all.
  // If the component renders in "review mode" (all tasks true = collapsed expanded view),
  //   show all tasks so the user can review what was done.
  const [visibleKeys, setVisibleKeys] = useState<Set<TaskKey>>(() => {
    const falseKeys = ALL_TASK_KEYS.filter((k) => !tasks[k]);
    if (falseKeys.length > 0) {
      return new Set(falseKeys);
    }
    // All tasks are true (either all complete or all N/A pre-fix) — show all for review
    return new Set(ALL_TASK_KEYS);
  });

  const handleToggle = useCallback(
    async (taskKey: TaskKey, currentValue: boolean) => {
      if (pendingKeys.has(taskKey)) return; // already in-flight for this key

      const newValue = !currentValue;
      const updated = { ...tasks, [taskKey]: newValue };

      // Ensure the toggled key is visible (handles edge case where an N/A task is toggled)
      setVisibleKeys((prev) => {
        if (prev.has(taskKey)) return prev;
        const next = new Set(prev);
        next.add(taskKey);
        return next;
      });

      // 1. Immediately propagate to parent so collapse logic fires right away.
      //    This is synchronous — the parent's localTaskOverrides will update
      //    before any async operation runs.
      onTasksChange?.(updated);

      // 2. Mark this key as in-flight
      setPendingKeys((prev) => new Set([...prev, taskKey]));

      try {
        if (!actor) throw new Error("Actor not available");
        await actor.toggleAppointmentTaskComplete(
          appointmentId,
          taskKey,
          newValue,
        );

        // 3. On success: patch the exact query cache for this MRN so the
        //    parent's seeding effect won't see stale server data.
        //    Use setQueryData with the precise key to avoid notifying
        //    unrelated subscribers.
        queryClient.setQueryData<
          import("../../types/appointment").VetAppointment[]
        >(["appointments-by-mrn", mrn], (old) => {
          if (!old) return old;
          return old.map((a) => {
            if (a.appointmentId !== appointmentId) return a;
            return { ...a, tasks: { ...a.tasks, [taskKey]: newValue } };
          });
        });
        // Also silently patch the dashboard appointments cache
        queryClient.setQueriesData<
          import("../../types/appointment").VetAppointment[]
        >({ queryKey: ["appointments"] }, (old) => {
          if (!old) return old;
          return old.map((a) => {
            if (a.appointmentId !== appointmentId) return a;
            return { ...a, tasks: { ...a.tasks, [taskKey]: newValue } };
          });
        });
      } catch {
        // 4. On failure: roll back using the value BEFORE this toggle
        const rolledBack = { ...tasks, [taskKey]: currentValue };
        onTasksChange?.(rolledBack);
      } finally {
        // 5. Always clear the pending marker for this key
        setPendingKeys((prev) => {
          const next = new Set(prev);
          next.delete(taskKey);
          return next;
        });
      }
    },
    // biome-ignore lint/correctness/useExhaustiveDependencies: setVisibleKeys is a stable setState function
    [appointmentId, mrn, tasks, onTasksChange, actor, queryClient, pendingKeys],
  );

  const displayKeys = Array.from(visibleKeys);

  if (displayKeys.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-teal-100">
      <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide mb-1.5">
        Tasks
      </p>
      <div className="flex flex-wrap gap-1.5">
        {displayKeys.map((key) => (
          <TaskBadge
            key={key}
            taskKey={key}
            completed={tasks[key]}
            onClick={
              pendingKeys.has(key)
                ? undefined
                : () => handleToggle(key, tasks[key])
            }
            showLabel={true}
          />
        ))}
      </div>
    </div>
  );
}
