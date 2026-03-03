import React from "react";
import { useUpdateAppointmentTask } from "../../hooks/useQueries";
import type { TaskKey, TaskStatus } from "../../types/case";
import TaskBadge from "./TaskBadge";

// All task keys shown on the cases page per appointment
const APPOINTMENT_TASK_KEYS: TaskKey[] = [
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
  // tasks is the authoritative value — managed by the parent via onTasksChange
  tasks: TaskStatus;
  onTasksChange?: (updated: TaskStatus) => void;
}

export default function AppointmentTaskList({
  appointmentId,
  tasks,
  onTasksChange,
}: AppointmentTaskListProps) {
  // Fully controlled — no internal state. Parent owns the optimistic copy via
  // localTaskOverrides so that the completed/collapsed logic in AppointmentsSection
  // always has the latest value immediately after a toggle.
  const { mutate: updateTask, isPending } = useUpdateAppointmentTask();

  const handleToggle = (taskKey: TaskKey, currentValue: boolean) => {
    const newValue = !currentValue;
    const updated = { ...tasks, [taskKey]: newValue };
    // Propagate optimistic update to parent immediately
    onTasksChange?.(updated);

    updateTask(
      {
        appointmentId,
        taskName: taskKey,
        isCompleted: newValue,
      },
      {
        onError: () => {
          // Roll back to the value before this toggle
          onTasksChange?.(tasks);
        },
      },
    );
  };

  return (
    <div className="mt-2 pt-2 border-t border-teal-100">
      <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide mb-1.5">
        Tasks
      </p>
      <div className="flex flex-wrap gap-1.5">
        {APPOINTMENT_TASK_KEYS.map((key) => (
          <TaskBadge
            key={key}
            taskKey={key}
            completed={tasks[key]}
            onClick={
              isPending ? undefined : () => handleToggle(key, tasks[key])
            }
            showLabel={true}
          />
        ))}
      </div>
    </div>
  );
}
