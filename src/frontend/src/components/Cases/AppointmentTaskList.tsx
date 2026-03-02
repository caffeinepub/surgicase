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
  tasks: TaskStatus;
}

export default function AppointmentTaskList({
  appointmentId,
  tasks,
}: AppointmentTaskListProps) {
  const { mutate: updateTask, isPending } = useUpdateAppointmentTask();

  const handleToggle = (taskKey: TaskKey, currentValue: boolean) => {
    updateTask({
      appointmentId,
      taskName: taskKey,
      isCompleted: !currentValue,
    });
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
