import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import {
  Beaker,
  Bell,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  Microscope,
  Pencil,
  Plus,
  ScanLine,
  Scissors,
  Trash2,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { useActor } from "../../hooks/useActor";
import {
  useDeleteAppointment,
  useGetAppointments,
} from "../../hooks/useQueries";
import type { VetAppointment } from "../../types/appointment";
import { areAllTasksComplete } from "../../types/case";
import {
  formatCalendarDayHeader,
  getWeekDays,
  isSameDay,
  isToday,
} from "../../utils/dateUtils";
import EditAppointmentForm from "./EditAppointmentForm";
import NewAppointmentForm from "./NewAppointmentForm";

// Task definitions for interactive badges
const TASK_DEFINITIONS = [
  {
    key: "dischargeNotes",
    label: "Discharge Notes",
    icon: FileText,
    completedClass: "bg-green-100 text-green-700 border-green-300",
    incompleteClass: "bg-gray-50 text-gray-400 border-gray-200",
  },
  {
    key: "pDVMNotified",
    label: "pDVM Notified",
    icon: Bell,
    completedClass: "bg-yellow-100 text-yellow-700 border-yellow-300",
    incompleteClass: "bg-gray-50 text-gray-400 border-gray-200",
  },
  {
    key: "labs",
    label: "Labs",
    icon: FlaskConical,
    completedClass: "bg-orange-100 text-orange-700 border-orange-300",
    incompleteClass: "bg-gray-50 text-gray-400 border-gray-200",
  },
  {
    key: "histo",
    label: "Histo",
    icon: Microscope,
    completedClass: "bg-purple-100 text-purple-700 border-purple-300",
    incompleteClass: "bg-gray-50 text-gray-400 border-gray-200",
  },
  {
    key: "surgeryReport",
    label: "Surgery Report",
    icon: Scissors,
    completedClass: "bg-red-100 text-red-700 border-red-300",
    incompleteClass: "bg-gray-50 text-gray-400 border-gray-200",
  },
  {
    key: "imaging",
    label: "Imaging",
    icon: ScanLine,
    completedClass: "bg-blue-100 text-blue-700 border-blue-300",
    incompleteClass: "bg-gray-50 text-gray-400 border-gray-200",
  },
  {
    key: "culture",
    label: "Culture",
    icon: Beaker,
    completedClass: "bg-pink-100 text-pink-700 border-pink-300",
    incompleteClass: "bg-gray-50 text-gray-400 border-gray-200",
  },
  {
    key: "dailySummary",
    label: "Daily Summary",
    icon: ClipboardList,
    completedClass: "bg-teal-100 text-teal-700 border-teal-300",
    incompleteClass: "bg-gray-50 text-gray-400 border-gray-200",
  },
] as const;

type TaskKey = (typeof TASK_DEFINITIONS)[number]["key"];

interface DashboardPageProps {
  onNavigateToCaseDetail: (caseId: bigint) => void;
}

interface AppointmentTaskBadgesProps {
  appointment: VetAppointment;
}

function AppointmentTaskBadges({ appointment }: AppointmentTaskBadgesProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [pendingKeys, setPendingKeys] = useState<Set<TaskKey>>(new Set());

  const handleToggle = async (taskKey: TaskKey, currentValue: boolean) => {
    if (pendingKeys.has(taskKey)) return;
    const newValue = !currentValue;

    // 1. Optimistically update both appointment caches immediately
    const patchFn = (
      old: VetAppointment[] | undefined,
    ): VetAppointment[] | undefined => {
      if (!old) return old;
      return old.map((a) => {
        if (a.appointmentId !== appointment.appointmentId) return a;
        return { ...a, tasks: { ...a.tasks, [taskKey]: newValue } };
      });
    };
    queryClient.setQueryData<VetAppointment[]>(["appointments"], patchFn);
    queryClient.setQueryData<VetAppointment[]>(
      ["appointments-by-mrn", appointment.mrn],
      patchFn,
    );

    setPendingKeys((prev) => new Set([...prev, taskKey]));

    try {
      if (!actor) throw new Error("Actor not available");
      await actor.toggleAppointmentTaskComplete(
        appointment.appointmentId,
        taskKey,
        newValue,
      );
    } catch {
      // Roll back on failure
      const rollbackFn = (
        old: VetAppointment[] | undefined,
      ): VetAppointment[] | undefined => {
        if (!old) return old;
        return old.map((a) => {
          if (a.appointmentId !== appointment.appointmentId) return a;
          return { ...a, tasks: { ...a.tasks, [taskKey]: currentValue } };
        });
      };
      queryClient.setQueryData<VetAppointment[]>(["appointments"], rollbackFn);
      queryClient.setQueryData<VetAppointment[]>(
        ["appointments-by-mrn", appointment.mrn],
        rollbackFn,
      );
    } finally {
      setPendingKeys((prev) => {
        const next = new Set(prev);
        next.delete(taskKey);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-0.5 mt-1.5">
      {TASK_DEFINITIONS.map((task) => {
        const isCompleted = appointment.tasks[
          task.key as keyof typeof appointment.tasks
        ] as boolean;
        const Icon = task.icon;

        return (
          <Tooltip key={task.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(task.key, isCompleted);
                }}
                disabled={pendingKeys.has(task.key)}
                className={`
                                    inline-flex items-center justify-center w-5 h-5 rounded-full border transition-all
                                    hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                                    ${isCompleted ? task.completedClass : task.incompleteClass}
                                `}
                aria-label={`${task.label}: ${isCompleted ? "complete" : "incomplete"}`}
              >
                <Icon className="w-2.5 h-2.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {task.label}: {isCompleted ? "✓ Done" : "Pending"}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

interface AppointmentCardProps {
  appointment: VetAppointment;
  onCardClick: (caseId: bigint) => void;
  onDeleteRequest: (appointment: VetAppointment) => void;
  onEditRequest: (appointment: VetAppointment) => void;
}

function AppointmentCard({
  appointment,
  onCardClick,
  onDeleteRequest,
  onEditRequest,
}: AppointmentCardProps) {
  // Only allow navigation if the appointment has a valid linked case (non-zero caseId)
  const hasLinkedCase = appointment.caseId && appointment.caseId !== 0n;
  const allTasksDone = areAllTasksComplete(appointment.tasks);

  return (
    <div
      className={`w-full text-left rounded-lg px-2.5 py-2 text-xs transition-all hover:shadow-md hover:-translate-y-0.5 group relative ${
        allTasksDone
          ? "bg-green-50 border border-green-200 opacity-70"
          : "bg-white border border-gray-200"
      }`}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: navigation shortcut; all content is also reachable via keyboard through the buttons */}
      <div
        className={hasLinkedCase ? "cursor-pointer" : "cursor-default"}
        onClick={() => {
          if (hasLinkedCase) {
            onCardClick(appointment.caseId);
          }
        }}
      >
        <div className="flex items-center gap-1.5 mb-0.5 pr-10">
          <span
            className={`font-bold truncate ${allTasksDone ? "text-gray-400 line-through" : "text-gray-900"} ${hasLinkedCase && !allTasksDone ? "hover:text-teal-700 hover:underline" : ""}`}
          >
            {appointment.patientName || "—"}
          </span>
          {allTasksDone ? (
            <CheckCircle2 className="ml-auto w-3.5 h-3.5 text-green-500 shrink-0" />
          ) : (
            <span className="ml-auto text-[10px] font-medium text-gray-400 shrink-0">
              {appointment.mrn}
            </span>
          )}
        </div>
        {!allTasksDone && appointment.ownerName && (
          <div className="text-[10px] text-gray-500 truncate pl-5 mb-0.5">
            {appointment.ownerName}
          </div>
        )}
        {!allTasksDone && appointment.dateOfBirth && (
          <div className="text-[10px] text-gray-400 truncate pl-5 mb-0.5">
            DOB: {appointment.dateOfBirth}
          </div>
        )}
        {appointment.reason && (
          <div
            className={`text-[10px] italic truncate pl-5 mb-0.5 ${allTasksDone ? "text-gray-300" : "text-gray-400"}`}
          >
            {appointment.reason}
          </div>
        )}
      </div>

      {/* Action buttons: edit + delete */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditRequest(appointment);
          }}
          className="p-0.5 rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          title="Edit appointment"
          aria-label="Edit appointment"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRequest(appointment);
          }}
          className="p-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Delete appointment"
          aria-label="Delete appointment"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Interactive task badges — hidden when all tasks are done */}
      {!allTasksDone && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation-only wrapper, not an interactive element
        <div className="pl-5" onClick={(e) => e.stopPropagation()}>
          <AppointmentTaskBadges appointment={appointment} />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage({
  onNavigateToCaseDetail,
}: DashboardPageProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<VetAppointment | null>(null);
  const [appointmentToEdit, setAppointmentToEdit] =
    useState<VetAppointment | null>(null);

  const { data: appointments = [], isLoading, error } = useGetAppointments();
  const deleteAppointment = useDeleteAppointment();

  // Compute the 7 days for the displayed week
  const weekDays = useMemo(() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + weekOffset * 7);
    return getWeekDays(ref);
  }, [weekOffset]);

  // Map appointments to their day
  const appointmentsByDay = useMemo(() => {
    return weekDays.map((day) => {
      return appointments.filter((a: VetAppointment) => {
        if (!a.arrivalDate) return false;
        let d: Date | null = null;
        if (a.arrivalDate.includes("-")) {
          d = new Date(a.arrivalDate);
        } else {
          const parts = a.arrivalDate.split("/");
          if (parts.length === 3) {
            const [mm, dd, yyyy] = parts.map(Number);
            d = new Date(yyyy, mm - 1, dd);
          }
        }
        return d ? isSameDay(d, day) : false;
      });
    });
  }, [appointments, weekDays]);

  const handleTodayFilter = () => {
    if (!showTodayOnly) {
      setWeekOffset(0);
    }
    setShowTodayOnly((prev) => !prev);
  };

  const handlePrevWeek = () => {
    setWeekOffset((o) => o - 1);
    setShowTodayOnly(false);
  };

  const handleNextWeek = () => {
    setWeekOffset((o) => o + 1);
    setShowTodayOnly(false);
  };

  const handleGoToCurrentWeek = () => {
    setWeekOffset(0);
    setShowTodayOnly(false);
  };

  const displayDays = useMemo(() => {
    if (showTodayOnly) {
      return weekDays.filter((day) => isToday(day));
    }
    return weekDays;
  }, [weekDays, showTodayOnly]);

  const displayAppointmentsByDay = useMemo(() => {
    if (showTodayOnly) {
      return appointmentsByDay.filter((_, idx) => isToday(weekDays[idx]));
    }
    return appointmentsByDay;
  }, [appointmentsByDay, weekDays, showTodayOnly]);

  const totalAppointmentsVisible = useMemo(
    () => displayAppointmentsByDay.reduce((sum, arr) => sum + arr.length, 0),
    [displayAppointmentsByDay],
  );

  const periodLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startStr = `${start.toLocaleString("en-US", { month: "short" })} ${start.getDate()}`;
    const endStr = `${end.toLocaleString("en-US", { month: "short" })} ${end.getDate()}, ${end.getFullYear()}`;
    return `${startStr} – ${endStr}`;
  }, [weekDays]);

  const isCurrentPeriod = weekOffset === 0;

  const handleConfirmDelete = () => {
    if (!appointmentToDelete) return;
    deleteAppointment.mutate(appointmentToDelete.appointmentId, {
      onSettled: () => {
        setAppointmentToDelete(null);
      },
    });
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Page header */}
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-3 flex-wrap sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <h1 className="text-lg font-bold text-gray-900">Appointments</h1>
            </div>
            <span className="text-sm text-gray-400 hidden sm:block">
              {showTodayOnly
                ? new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : periodLabel}
            </span>
            {totalAppointmentsVisible > 0 && (
              <span className="text-xs bg-teal-50 text-teal-700 font-medium px-2 py-0.5 rounded-full border border-teal-100">
                {totalAppointmentsVisible} appt
                {totalAppointmentsVisible !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTodayFilter}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                showTodayOnly
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              title={showTodayOnly ? "Show full week" : "Show today only"}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Today
            </button>

            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1.5 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleGoToCurrentWeek}
                disabled={isCurrentPeriod && !showTodayOnly}
                className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-x border-gray-200"
                title="Go to current week"
              >
                This Week
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1.5 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowNewAppointment(true)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Appointment</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-auto p-3 sm:p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 gap-3">
              <svg
                className="animate-spin w-6 h-6 text-teal-500"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
                role="presentation"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm text-gray-500">
                Loading appointments...
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-red-500">
                Failed to load appointments.
              </p>
            </div>
          ) : (
            <>
              {/* Day headers (name row) */}
              <div
                className="grid gap-1 mb-1"
                style={{
                  gridTemplateColumns: `repeat(${displayDays.length}, minmax(0, 1fr))`,
                }}
              >
                {displayDays.map((day) => {
                  const header = formatCalendarDayHeader(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide py-1"
                    >
                      {header.dayName}
                    </div>
                  );
                })}
              </div>

              {/* Date numbers row */}
              <div
                className="grid gap-1 mb-2"
                style={{
                  gridTemplateColumns: `repeat(${displayDays.length}, minmax(0, 1fr))`,
                }}
              >
                {displayDays.map((day) => {
                  const todayFlag = isToday(day);
                  const dayNumber = day.getDate();
                  return (
                    <div
                      key={day.toISOString()}
                      className="flex justify-center"
                    >
                      <div
                        className={`text-center text-sm font-bold py-0.5 rounded-full w-7 h-7 flex items-center justify-center ${
                          todayFlag ? "bg-teal-600 text-white" : "text-gray-700"
                        }`}
                      >
                        {dayNumber}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calendar cells */}
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${displayDays.length}, minmax(0, 1fr))`,
                }}
              >
                {displayDays.map((day, colIdx) => {
                  const dayAppts = displayAppointmentsByDay[colIdx] ?? [];
                  const todayFlag = isToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[120px] rounded-lg p-1 flex flex-col gap-1 ${
                        todayFlag
                          ? "bg-teal-50/50 border border-teal-100"
                          : "bg-gray-50/50"
                      }`}
                    >
                      {dayAppts.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-[10px] text-gray-300">—</span>
                        </div>
                      ) : (
                        dayAppts.map((appt: VetAppointment) => (
                          <AppointmentCard
                            key={appt.appointmentId.toString()}
                            appointment={appt}
                            onCardClick={onNavigateToCaseDetail}
                            onDeleteRequest={setAppointmentToDelete}
                            onEditRequest={setAppointmentToEdit}
                          />
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* New Appointment Modal */}
        {showNewAppointment && (
          <NewAppointmentForm
            onClose={() => setShowNewAppointment(false)}
            onSuccess={() => setShowNewAppointment(false)}
          />
        )}

        {/* Edit Appointment Modal */}
        {appointmentToEdit && (
          <EditAppointmentForm
            appointment={appointmentToEdit}
            onClose={() => setAppointmentToEdit(null)}
            onSuccess={() => setAppointmentToEdit(null)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!appointmentToDelete}
          onOpenChange={(open) => {
            if (!open) setAppointmentToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the appointment for{" "}
                <strong>{appointmentToDelete?.patientName}</strong>? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteAppointment.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
