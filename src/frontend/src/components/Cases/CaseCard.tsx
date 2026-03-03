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
  Cake,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import React, { useState } from "react";
import {
  useDeleteAppointment,
  useDeleteCase,
  useGetAppointmentsByMRN,
} from "../../hooks/useQueries";
import type { VetAppointment } from "../../types/appointment";
import type { Sex, Species, TaskKey, VetCase } from "../../types/case";
import { areAllTasksComplete } from "../../types/case";
import { ALL_TASK_KEYS } from "../../types/case";
import { calculateAge, parseDate } from "../../utils/dateUtils";
import EditAppointmentForm from "../Dashboard/EditAppointmentForm";
import NewAppointmentForm from "../Dashboard/NewAppointmentForm";
import AppointmentTaskList from "./AppointmentTaskList";
import EditCaseForm from "./EditCaseForm";

function areAllApptTasksComplete(
  tasks: import("../../types/case").TaskStatus,
): boolean {
  return ALL_TASK_KEYS.every((k) => tasks[k]);
}

const SPECIES_LABELS: Record<Species, string> = {
  canine: "Canine",
  feline: "Feline",
  other: "Other",
};

const SEX_LABELS: Record<Sex, string> = {
  male: "Male (Intact)",
  maleNeutered: "Male (Neutered)",
  female: "Female (Intact)",
  femaleSpayed: "Female (Spayed)",
};

function getSpeciesIconSrc(species: Species): string {
  if (species === "canine") return "/assets/generated/dog-icon.png";
  if (species === "feline") return "/assets/generated/cat-icon.png";
  return "/assets/generated/other-icon.png";
}

interface SpeciesBadgeProps {
  species: Species;
}

function SpeciesBadge({ species }: SpeciesBadgeProps) {
  const iconSrc = getSpeciesIconSrc(species);

  const colors: Record<Species, string> = {
    canine: "bg-amber-50 text-amber-700 border-amber-200",
    feline: "bg-violet-50 text-violet-700 border-violet-200",
    other: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[species]}`}
    >
      <img
        src={iconSrc}
        alt={species}
        className="w-3.5 h-3.5 object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      {SPECIES_LABELS[species]}
    </span>
  );
}

interface CaseCardProps {
  vetCase: VetCase;
  editable?: boolean;
  onUpdate?: (updated: VetCase) => void;
  onDelete?: () => void;
  onClick?: () => void;
  highlight?: boolean;
}

function AppointmentsSection({ mrn }: { mrn: string }) {
  const [expanded, setExpanded] = useState(true);
  const [expandedCompletedIds, setExpandedCompletedIds] = useState<Set<string>>(
    new Set(),
  );
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<VetAppointment | null>(null);
  const [appointmentToEdit, setAppointmentToEdit] =
    useState<VetAppointment | null>(null);
  // Optimistic local task overrides keyed by appointmentId string
  const [localTaskOverrides, setLocalTaskOverrides] = useState<
    Record<string, import("../../types/case").TaskStatus>
  >({});

  const toggleCompletedExpanded = (id: string) => {
    setExpandedCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleLocalTasksChange = (
    apptIdStr: string,
    updated: import("../../types/case").TaskStatus,
  ) => {
    setLocalTaskOverrides((prev) => ({ ...prev, [apptIdStr]: updated }));
  };

  const { data: appointments = [], isLoading } = useGetAppointmentsByMRN(mrn);
  const deleteAppointment = useDeleteAppointment();

  const sorted = [...appointments].sort((a, b) => {
    const da = parseDate(a.arrivalDate)?.getTime() ?? 0;
    const db = parseDate(b.arrivalDate)?.getTime() ?? 0;
    return da - db;
  });

  // Seed localTaskOverrides from server data whenever the appointments list
  // changes (e.g. on initial load or after a refetch). This ensures appointments
  // that are already fully complete on the server are immediately shown as
  // collapsed without requiring a task toggle in the current session.
  React.useEffect(() => {
    if (appointments.length === 0) return;
    setLocalTaskOverrides((prev) => {
      const next = { ...prev };
      for (const appt of appointments) {
        const id = String(appt.appointmentId);
        // Only seed if we don't already have a local override for this appt
        if (!(id in next)) {
          next[id] = appt.tasks;
        }
      }
      return next;
    });
  }, [appointments]);

  const handleConfirmDelete = () => {
    if (!appointmentToDelete) return;
    deleteAppointment.mutate(appointmentToDelete.appointmentId, {
      onSettled: () => {
        setAppointmentToDelete(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Loading appointments...</span>
        </div>
      </div>
    );
  }

  if (sorted.length === 0) return null;

  return (
    <>
      <div className="mt-3 pt-3 border-t border-teal-100">
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2 w-full hover:text-teal-800 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Appointments ({sorted.length})
          {expanded ? (
            <ChevronUp className="w-3 h-3 ml-auto" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-auto" />
          )}
        </button>

        {expanded && (
          <div className="space-y-2">
            {sorted.map((appt) => {
              const apptIdStr = String(appt.appointmentId);
              // Use local optimistic tasks if available, otherwise server data
              const effectiveTasks =
                localTaskOverrides[apptIdStr] ?? appt.tasks;
              const apptAllDone = areAllApptTasksComplete(effectiveTasks);
              const isCompletedExpanded = expandedCompletedIds.has(apptIdStr);
              return apptAllDone ? (
                /* Completed appointment — compact collapsed row, expandable */
                <div
                  key={apptIdStr}
                  className="border border-green-200 rounded-lg bg-white group"
                  data-ocid={`cases.appointment.item.${apptIdStr}`}
                >
                  {/* Header row */}
                  <div className="px-3 py-1.5 flex items-center gap-2 relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompletedExpanded(apptIdStr);
                      }}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      aria-expanded={isCompletedExpanded}
                      aria-label={
                        isCompletedExpanded
                          ? "Collapse completed appointment"
                          : "Expand completed appointment to review tasks"
                      }
                      data-ocid={`cases.appointment.toggle.${apptIdStr}`}
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-600">
                        {appt.arrivalDate}
                      </span>
                      {appt.reason && (
                        <span className="text-xs text-gray-500 italic truncate flex-1">
                          {appt.reason}
                        </span>
                      )}
                    </button>
                    {/* Edit/Delete visible on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAppointmentToEdit(appt);
                        }}
                        className="p-0.5 rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Edit appointment"
                        aria-label="Edit appointment"
                        data-ocid={`cases.appointment.edit_button.${apptIdStr}`}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAppointmentToDelete(appt);
                        }}
                        className="p-0.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete appointment"
                        aria-label="Delete appointment"
                        data-ocid={`cases.appointment.delete_button.${apptIdStr}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <CheckCircle2
                      className="w-4 h-4 text-green-500 flex-shrink-0"
                      aria-label="All tasks complete"
                    />
                    {isCompletedExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  {/* Expanded task review */}
                  {isCompletedExpanded && (
                    <div className="px-3 pb-2 border-t border-green-100 pt-2">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1.5">
                        Completed Tasks
                      </p>
                      <AppointmentTaskList
                        appointmentId={appt.appointmentId}
                        tasks={effectiveTasks}
                        onTasksChange={(updated) =>
                          handleLocalTasksChange(apptIdStr, updated)
                        }
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Incomplete appointment — full task list */
                <div
                  key={String(appt.appointmentId)}
                  className="border border-teal-100 rounded-lg px-2.5 py-2 group relative bg-teal-50"
                  data-ocid={`cases.appointment.item.${String(appt.appointmentId)}`}
                >
                  {/* Appointment header */}
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <CalendarDays className="w-3.5 h-3.5 text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0 pr-14">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-teal-800">
                          {appt.arrivalDate}
                        </span>
                        {appt.reason && (
                          <span className="text-xs italic truncate text-teal-700">
                            {appt.reason}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAppointmentToEdit(appt);
                        }}
                        className="p-0.5 rounded text-teal-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Edit appointment"
                        aria-label="Edit appointment"
                        data-ocid={`cases.appointment.edit_button.${String(appt.appointmentId)}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAppointmentToDelete(appt);
                        }}
                        className="p-0.5 rounded text-teal-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete appointment"
                        aria-label="Delete appointment"
                        data-ocid={`cases.appointment.delete_button.${String(appt.appointmentId)}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <AppointmentTaskList
                    appointmentId={appt.appointmentId}
                    tasks={effectiveTasks}
                    onTasksChange={(updated) =>
                      handleLocalTasksChange(apptIdStr, updated)
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

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
              Are you sure you want to delete the appointment
              {appointmentToDelete?.arrivalDate
                ? ` on ${appointmentToDelete.arrivalDate}`
                : ""}
              {appointmentToDelete?.reason
                ? ` (${appointmentToDelete.reason})`
                : ""}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAppointment.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteAppointment.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteAppointment.isPending ? (
                <span className="flex items-center gap-1.5">
                  <svg
                    className="animate-spin w-3.5 h-3.5"
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
                  Deleting…
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function CaseCard({
  vetCase,
  editable = false,
  onUpdate: _onUpdate,
  onDelete,
  onClick,
  highlight,
}: CaseCardProps) {
  const [localCase, setLocalCase] = useState<VetCase>(vetCase);
  const [showDeleteCaseDialog, setShowDeleteCaseDialog] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [showEditCaseForm, setShowEditCaseForm] = useState(false);

  const deleteCase = useDeleteCase();

  // Sync when parent updates
  React.useEffect(() => {
    setLocalCase(vetCase);
  }, [vetCase]);

  const allComplete = areAllTasksComplete(localCase.tasks);

  const handleConfirmDeleteCase = () => {
    deleteCase.mutate(localCase.caseId, {
      onSuccess: () => {
        setShowDeleteCaseDialog(false);
        onDelete?.();
      },
      onError: () => {
        setShowDeleteCaseDialog(false);
      },
    });
  };

  const age = localCase.dateOfBirth
    ? calculateAge(localCase.dateOfBirth)
    : null;

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: card click is a convenience shortcut; all actions are also reachable via keyboard-accessible buttons */}
      <div
        className={`surgi-card p-4 transition-all duration-200 ${
          allComplete ? "opacity-50" : ""
        } ${onClick ? "cursor-pointer hover:shadow-card-hover hover:border-blue-200" : ""} ${
          highlight ? "case-highlight" : ""
        }`}
        onClick={!editable ? onClick : undefined}
      >
        {/* Top row: Pet Name + MRN + Action Buttons */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
              <img
                src={getSpeciesIconSrc(localCase.species)}
                alt={localCase.species}
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-gray-900 leading-tight">
                  {localCase.petName}
                </span>
                <SpeciesBadge species={localCase.species} />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Tag className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs font-mono text-gray-500">
                  MRN: {localCase.mrn}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation-only wrapper, not an interactive element */}
          <div
            className="flex items-center gap-1 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddAppointment(true);
              }}
              className="p-1 rounded text-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
              title="Add appointment"
              aria-label="Add appointment"
            >
              <CalendarPlus className="w-4 h-4" />
            </button>
            {editable && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditCaseForm(true);
                  }}
                  className="p-1 rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  title="Edit case"
                  aria-label="Edit case"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteCaseDialog(true);
                  }}
                  className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete case"
                  aria-label="Delete case"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Patient info grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-gray-500">Owner:</span>
            <span className="text-gray-700 font-medium truncate">
              {localCase.ownerLastName || "—"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Sex:</span>
            <span className="text-gray-700 font-medium">
              {SEX_LABELS[localCase.sex]}
            </span>
          </div>
          {localCase.breed && (
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="text-gray-500">Breed:</span>
              <span className="text-gray-700 font-medium truncate">
                {localCase.breed}
              </span>
            </div>
          )}
          {localCase.dateOfBirth && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Cake className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500">DOB:</span>
              <span className="text-gray-700 font-medium">
                {localCase.dateOfBirth}
              </span>
              {age && <span className="text-gray-400">({age})</span>}
            </div>
          )}
        </div>

        {/* Presenting Complaint */}
        {localCase.presentingComplaint && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Complaint
            </p>
            <p className="text-sm text-gray-700 leading-snug">
              {localCase.presentingComplaint}
            </p>
          </div>
        )}

        {/* Notes */}
        {localCase.notes && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Notes
            </p>
            <p className="text-sm text-gray-600 leading-snug">
              {localCase.notes}
            </p>
          </div>
        )}

        {/* Appointments */}
        <AppointmentsSection mrn={localCase.mrn} />
      </div>

      {/* Add Appointment Modal */}
      {showAddAppointment && (
        <NewAppointmentForm
          onClose={() => setShowAddAppointment(false)}
          onSuccess={() => setShowAddAppointment(false)}
          prefill={{
            patientName: localCase.petName,
            mrn: localCase.mrn,
            species: localCase.species,
            sex: localCase.sex,
            ownerName: localCase.ownerLastName,
            breed: localCase.breed,
          }}
        />
      )}

      {/* Edit Case Modal — uses open prop and onClose only */}
      <EditCaseForm
        vetCase={localCase}
        open={showEditCaseForm}
        onClose={() => setShowEditCaseForm(false)}
      />

      {/* Delete Case Confirmation */}
      <AlertDialog
        open={showDeleteCaseDialog}
        onOpenChange={(open) => {
          if (!open) setShowDeleteCaseDialog(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the case for{" "}
              <strong>{localCase.petName}</strong> (MRN: {localCase.mrn})? This
              will also delete all associated appointments. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCase.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteCase}
              disabled={deleteCase.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteCase.isPending ? (
                <span className="flex items-center gap-1.5">
                  <svg
                    className="animate-spin w-3.5 h-3.5"
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
                  Deleting…
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
