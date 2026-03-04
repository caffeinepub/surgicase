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

  // selectedKeys: the set of tasks that were "selected" for this appointment
  // (i.e., need to be done). Determined once on mount from initial task state.
  //
  // Convention: selected tasks are stored as false (incomplete) initially.
  // Unselected/N/A tasks are stored as true.
  //
  // When all selected tasks are later completed (true), we still remember
  // which keys were originally selected so the review panel can show them.
  //
  // Fallback for legacy appointments (all false → all selected): show all.
  const [selectedKeys] = useState<Set<TaskKey>>(() => {
    const falseKeys = ALL_TASK_KEYS.filter((k) => !tasks[k]);
    if (falseKeys.length > 0) {
      // Some tasks are false → those are the selected/applicable tasks
      return new Set(falseKeys);
    }
    // All tasks are true on first render: either all done or legacy all-N/A.
    // Show all 8 so the completed review doesn't show empty.
    return new Set(ALL_TASK_KEYS);
  });

  // visibleKeys: only show selected keys (never N/A tasks)
  const [visibleKeys, setVisibleKeys] = useState<Set<TaskKey>>(
    () => new Set(selectedKeys),
  );

  const handleToggle = useCallback(
    async (taskKey: TaskKey, currentValue: boolean) => {
      if (pendingKeys.has(taskKey)) return; // already in-flight for this key

      const newValue = !currentValue;
      const updated = { ...tasks, [taskKey]: newValue };

      // Only make the key visible if it was originally selected for this appointment
      if (selectedKeys.has(taskKey)) {
        setVisibleKeys((prev) => {
          if (prev.has(taskKey)) return prev;
          const next = new Set(prev);
          next.add(taskKey);
          return next;
        });
      }

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
    [
      appointmentId,
      mrn,
      tasks,
      onTasksChange,
      actor,
      queryClient,
      pendingKeys,
      selectedKeys,
    ],
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
