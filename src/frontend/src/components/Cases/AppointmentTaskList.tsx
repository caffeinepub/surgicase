import React, { useEffect, useState } from "react";
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
  tasks: TaskStatus;
  onTasksChange?: (updated: TaskStatus) => void;
}

export default function AppointmentTaskList({
  appointmentId,
  tasks,
  onTasksChange,
}: AppointmentTaskListProps) {
  // Keep a local optimistic copy so the UI responds instantly without waiting
  // for the ICP round-trip to complete.
  const [localTasks, setLocalTasks] = useState<TaskStatus>(tasks);
  const { mutate: updateTask, isPending } = useUpdateAppointmentTask();

  // Sync from server whenever server data changes (e.g. after refetch)
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleToggle = (taskKey: TaskKey, currentValue: boolean) => {
    const newValue = !currentValue;
    const updated = { ...localTasks, [taskKey]: newValue };
    // Apply optimistically first
    setLocalTasks(updated);
    onTasksChange?.(updated);

    updateTask(
      {
        appointmentId,
        taskName: taskKey,
        isCompleted: newValue,
      },
      {
        onError: () => {
          // Roll back on failure
          setLocalTasks(localTasks);
          onTasksChange?.(localTasks);
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
            completed={localTasks[key]}
            onClick={
              isPending ? undefined : () => handleToggle(key, localTasks[key])
            }
            showLabel={true}
          />
        ))}
      </div>
    </div>
  );
}
