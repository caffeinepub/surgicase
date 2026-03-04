import { CheckCircle2, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  useCreateAppointment,
  useCreateCase,
  useGetCaseByMRN,
} from "../../hooks/useQueries";
import type { Sex, Species, TaskStatus } from "../../types/case";
import { getTodayFormatted } from "../../utils/dateUtils";
import DateInput from "../shared/DateInput";

interface NewAppointmentFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  prefill?: {
    patientName?: string;
    mrn?: string;
    species?: Species;
    sex?: Sex;
    ownerName?: string;
    breed?: string;
  };
}

// selectedTasks tracks which tasks are SELECTED (i.e., need to be done).
// A selected task means it is NOT yet complete → stored as false.
// A task not selected for this appointment is also stored as false (just not shown).
// We track selection separately from completion to keep the semantics clear.
const DEFAULT_SELECTED_TASKS: Set<keyof TaskStatus> = new Set([
  "dischargeNotes",
  "pDVMNotified",
]);

const TASK_LABELS: { key: keyof TaskStatus; label: string }[] = [
  { key: "dischargeNotes", label: "Discharge Notes" },
  { key: "pDVMNotified", label: "pDVM Notified" },
  { key: "labs", label: "Labs" },
  { key: "histo", label: "Histo" },
  { key: "surgeryReport", label: "Surgery Report" },
  { key: "imaging", label: "Imaging" },
  { key: "culture", label: "Culture" },
  { key: "dailySummary", label: "Daily Summary" },
];

// Convert selectedTasks set → TaskStatus for storage.
// Selected tasks (need to be done) → stored as false (incomplete).
// Unselected tasks (not applicable) → stored as true (treated as "already done / N/A")
//   so they don't block the "all tasks complete" collapse check.
// This way collapse fires when all SELECTED tasks have been ticked off.
function buildTaskStatus(selected: Set<keyof TaskStatus>): TaskStatus {
  const ALL_KEYS: (keyof TaskStatus)[] = [
    "dischargeNotes",
    "pDVMNotified",
    "labs",
    "histo",
    "surgeryReport",
    "imaging",
    "culture",
    "dailySummary",
  ];
  const result = {} as TaskStatus;
  for (const k of ALL_KEYS) {
    // Selected = needs doing = false (incomplete); not selected = N/A = true (won't block collapse)
    result[k] = !selected.has(k);
  }
  return result;
}

function getDefaultForm(prefill?: NewAppointmentFormProps["prefill"]) {
  return {
    patientName: prefill?.patientName ?? "",
    ownerName: prefill?.ownerName ?? "",
    species: (prefill?.species ?? "canine") as Species,
    sex: (prefill?.sex ?? "male") as Sex,
    breed: prefill?.breed ?? "",
    mrn: prefill?.mrn ?? "",
    arrivalDate: getTodayFormatted(),
    dateOfBirth: "",
    reason: "",
    // selectedTasks: which tasks have been chosen for this appointment (all start incomplete)
    selectedTasks: new Set(DEFAULT_SELECTED_TASKS) as Set<keyof TaskStatus>,
  };
}

export default function NewAppointmentForm({
  onClose,
  onSuccess,
  prefill,
}: NewAppointmentFormProps) {
  const [form, setForm] = useState(() => getDefaultForm(prefill));
  const [successMsg, setSuccessMsg] = useState("");
  const [mrnLookup, setMrnLookup] = useState(prefill?.mrn ?? "");
  const [autoFilled, setAutoFilled] = useState(false);

  // Re-initialize form if prefill changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally tracking only key fields to avoid re-initializing on every render
  useEffect(() => {
    const newForm = getDefaultForm(prefill);
    setForm(newForm as typeof form);
    setMrnLookup(prefill?.mrn ?? "");
    setSuccessMsg("");
    setAutoFilled(false);
  }, [prefill?.mrn, prefill?.patientName]);

  // Debounce MRN lookup: update mrnLookup 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setMrnLookup(form.mrn);
    }, 500);
    return () => clearTimeout(timer);
  }, [form.mrn]);

  const { data: existingCase, isFetching: lookingUpMRN } =
    useGetCaseByMRN(mrnLookup);

  // Auto-fill fields when a matching case is found
  useEffect(() => {
    if (existingCase && mrnLookup.trim() && !lookingUpMRN) {
      setForm((f) => ({
        ...f,
        patientName: existingCase.petName,
        ownerName: existingCase.ownerLastName,
        species: existingCase.species,
        sex: existingCase.sex,
        breed: existingCase.breed,
        dateOfBirth: existingCase.dateOfBirth,
      }));
      setAutoFilled(true);
    } else if (!existingCase && mrnLookup.trim() && !lookingUpMRN) {
      setAutoFilled(false);
    }
  }, [existingCase, mrnLookup, lookingUpMRN]);

  const createAppointment = useCreateAppointment();
  const createCase = useCreateCase();

  const handleTaskToggle = (key: keyof TaskStatus) => {
    setForm((f) => {
      const next = new Set(f.selectedTasks);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return { ...f, selectedTasks: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName || !form.mrn) return;

    // Build task status: selected tasks are incomplete (false = needs to be done).
    // None start as complete — staff marks them done from the Cases/Calendar page.
    const taskStatus = buildTaskStatus(form.selectedTasks);

    try {
      // If no existing case for this MRN, create one first
      if (!existingCase) {
        await createCase.mutateAsync({
          mrn: form.mrn,
          arrivalDate: form.arrivalDate,
          petName: form.patientName,
          ownerLastName: form.ownerName,
          species: form.species,
          breed: form.breed,
          sex: form.sex,
          dateOfBirth: form.dateOfBirth,
          presentingComplaint: form.reason,
          notes: "",
          tasks: taskStatus,
        });
      }

      await createAppointment.mutateAsync({
        patientName: form.patientName,
        ownerName: form.ownerName,
        species: form.species,
        sex: form.sex,
        breed: form.breed,
        mrn: form.mrn,
        arrivalDate: form.arrivalDate,
        reason: form.reason,
        dateOfBirth: form.dateOfBirth,
        tasks: taskStatus,
      });

      setSuccessMsg(
        "Appointment scheduled! A case has been created or updated on the Cases page.",
      );
      setTimeout(() => {
        setForm(getDefaultForm(prefill) as typeof form);
        setSuccessMsg("");
        setAutoFilled(false);
        onSuccess?.();
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Failed to create appointment:", err);
    }
  };

  const isSubmitting = createAppointment.isPending || createCase.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                role="presentation"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Add Appointment</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isSubmitting}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              role="presentation"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {successMsg && (
            <div className="mb-4 flex items-start gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
              <svg
                className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
                role="presentation"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <p className="text-sm text-teal-800 font-medium">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} id="new-appointment-form">
            <div className="grid grid-cols-2 gap-3">
              {/* MRN — first so lookup happens before other fields */}
              <div className="col-span-2">
                <label
                  htmlFor="new-appt-mrn"
                  className="field-label block mb-1"
                >
                  MRN *
                </label>
                <div className="relative">
                  <input
                    id="new-appt-mrn"
                    type="text"
                    value={form.mrn}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, mrn: e.target.value }));
                      setAutoFilled(false);
                    }}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="Medical Record #"
                    required
                  />
                  {lookingUpMRN && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  {autoFilled && !lookingUpMRN && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
                {autoFilled && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Patient record found — fields auto-filled
                  </p>
                )}
                {!existingCase && mrnLookup.trim() && !lookingUpMRN && (
                  <p className="text-xs text-gray-400 mt-1">
                    No existing record — a new patient file will be created
                  </p>
                )}
              </div>

              {/* Patient Name */}
              <div className="col-span-1">
                <label
                  htmlFor="new-appt-patientName"
                  className="field-label block mb-1"
                >
                  Patient Name *
                </label>
                <input
                  id="new-appt-patientName"
                  type="text"
                  value={form.patientName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, patientName: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="Pet name"
                  required
                />
              </div>

              {/* Owner Name */}
              <div className="col-span-1">
                <label
                  htmlFor="new-appt-ownerName"
                  className="field-label block mb-1"
                >
                  Owner Name
                </label>
                <input
                  id="new-appt-ownerName"
                  type="text"
                  value={form.ownerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ownerName: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="Owner last name"
                />
              </div>

              {/* Species */}
              <div className="col-span-1">
                <label
                  htmlFor="new-appt-species"
                  className="field-label block mb-1"
                >
                  Species
                </label>
                <select
                  id="new-appt-species"
                  value={form.species}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      species: e.target.value as Species,
                    }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                >
                  <option value="canine">Canine</option>
                  <option value="feline">Feline</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Sex */}
              <div className="col-span-1">
                <label
                  htmlFor="new-appt-sex"
                  className="field-label block mb-1"
                >
                  Sex
                </label>
                <select
                  id="new-appt-sex"
                  value={form.sex}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sex: e.target.value as Sex }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                >
                  <option value="male">Male (Intact)</option>
                  <option value="maleNeutered">Male (Neutered)</option>
                  <option value="female">Female (Intact)</option>
                  <option value="femaleSpayed">Female (Spayed)</option>
                </select>
              </div>

              {/* Breed */}
              <div className="col-span-2">
                <label
                  htmlFor="new-appt-breed"
                  className="field-label block mb-1"
                >
                  Breed
                </label>
                <input
                  id="new-appt-breed"
                  type="text"
                  value={form.breed}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, breed: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="Breed"
                />
              </div>

              {/* Date of Birth */}
              <div className="col-span-1">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: DateInput is a custom component that manages its own internal input association */}
                <label
                  className="field-label block mb-1"
                  aria-label="Date of Birth"
                >
                  Date of Birth
                </label>
                <DateInput
                  value={form.dateOfBirth}
                  onChange={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))}
                  tabIndex={0}
                />
              </div>

              {/* Appointment Date */}
              <div className="col-span-1">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: DateInput is a custom component that manages its own internal input association */}
                <label
                  className="field-label block mb-1"
                  aria-label="Appointment Date"
                >
                  Appointment Date *
                </label>
                <DateInput
                  value={form.arrivalDate}
                  onChange={(v) => setForm((f) => ({ ...f, arrivalDate: v }))}
                  tabIndex={0}
                />
              </div>

              {/* Reason for Visit */}
              <div className="col-span-2">
                <label
                  htmlFor="new-appt-reason"
                  className="field-label block mb-1"
                >
                  Reason for Visit
                </label>
                <textarea
                  id="new-appt-reason"
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                  placeholder="Describe the reason for this appointment..."
                  rows={3}
                />
              </div>

              {/* Tasks */}
              <div className="col-span-2">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: group label for checkbox list, not associated with a single control */}
                <label
                  className="field-label block mb-1"
                  aria-label="Tasks to complete"
                >
                  Tasks to Complete
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Check all tasks that need to be done for this appointment.
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {TASK_LABELS.map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={form.selectedTasks.has(key)}
                        onChange={() => handleTaskToggle(key)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-400 cursor-pointer"
                      />
                      <span className="text-xs text-gray-700 group-hover:text-gray-900 transition-colors">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">
            {existingCase
              ? "Appointment will be added to existing patient record."
              : "A new patient record will be created automatically."}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-appointment-form"
              disabled={isSubmitting || !form.patientName || !form.mrn}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
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
                  Scheduling...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                    role="presentation"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Schedule Appointment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
