import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCreateCase, useGetCaseByMRN } from "../../hooks/useQueries";
import type { Sex, Species, TaskStatus } from "../../types/case";
import { getTodayFormatted } from "../../utils/dateUtils";
import { parseQuickFill } from "../../utils/parseUtils";
import DateInput from "../shared/DateInput";

// Tasks that are selected (need to be done) by default
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

const ALL_TASK_KEYS_LIST: (keyof TaskStatus)[] = [
  "dischargeNotes",
  "pDVMNotified",
  "labs",
  "histo",
  "surgeryReport",
  "imaging",
  "culture",
  "dailySummary",
];

// Convert selectedTasks set → TaskStatus for storage.
// Selected tasks (need to be done) → stored as false (incomplete).
// Unselected tasks (not applicable) → stored as true (won't block collapse).
function buildTaskStatusFromSelected(
  selected: Set<keyof TaskStatus>,
): TaskStatus {
  const result = {} as TaskStatus;
  for (const k of ALL_TASK_KEYS_LIST) {
    result[k] = !selected.has(k);
  }
  return result;
}

interface NewCaseFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_FILL_PLACEHOLDER = `Paste or dictate case info here, then click "Parse & Fill":

MRN: 12345
Arrival Date: 01/15/2026
Patient: Buddy
Owner: Smith
Canine, Labrador Retriever
Male Neutered (MN)
DOB: 03/22/2020
Complaint: Limping on right front leg
Notes: Post-op day 2`;

function getDefaultForm() {
  return {
    mrn: "",
    arrivalDate: getTodayFormatted(),
    petName: "",
    ownerLastName: "",
    species: "canine" as Species,
    breed: "",
    sex: "male" as Sex,
    dateOfBirth: "",
    presentingComplaint: "",
    notes: "",
    selectedTasks: new Set(DEFAULT_SELECTED_TASKS) as Set<keyof TaskStatus>,
  };
}

export default function NewCaseForm({ onClose, onSuccess }: NewCaseFormProps) {
  const [form, setForm] = useState(getDefaultForm());
  const [quickFill, setQuickFill] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [mrnLookup, setMrnLookup] = useState("");
  const [parseMsg, setParseMsg] = useState("");

  const petNameRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const createCase = useCreateCase();
  const { data: existingCase } = useGetCaseByMRN(mrnLookup);

  // MRN autofill
  useEffect(() => {
    if (existingCase && mrnLookup) {
      setForm((f) => ({
        ...f,
        mrn: existingCase.mrn,
        arrivalDate: existingCase.arrivalDate,
        petName: existingCase.petName,
        ownerLastName: existingCase.ownerLastName,
        species: existingCase.species,
        breed: existingCase.breed,
        sex: existingCase.sex,
        dateOfBirth: existingCase.dateOfBirth,
        presentingComplaint: existingCase.presentingComplaint,
        notes: existingCase.notes,
        // Keep selectedTasks from the form, not the case's stored tasks
      }));
    }
  }, [existingCase, mrnLookup]);

  const handleMRNChange = (val: string) => {
    setForm((f) => ({ ...f, mrn: val }));
    if (val.length >= 3) {
      setMrnLookup(val);
    } else {
      setMrnLookup("");
    }
  };

  const handleParseAndFill = () => {
    if (!quickFill.trim()) return;
    const parsed = parseQuickFill(quickFill);
    setForm((f) => ({
      ...f,
      ...(parsed.mrn !== undefined && { mrn: parsed.mrn }),
      ...(parsed.arrivalDate !== undefined && {
        arrivalDate: parsed.arrivalDate,
      }),
      ...(parsed.petName !== undefined && { petName: parsed.petName }),
      ...(parsed.ownerLastName !== undefined && {
        ownerLastName: parsed.ownerLastName,
      }),
      ...(parsed.species !== undefined && { species: parsed.species }),
      ...(parsed.breed !== undefined && { breed: parsed.breed }),
      ...(parsed.sex !== undefined && { sex: parsed.sex }),
      ...(parsed.dateOfBirth !== undefined && {
        dateOfBirth: parsed.dateOfBirth,
      }),
      ...(parsed.presentingComplaint !== undefined && {
        presentingComplaint: parsed.presentingComplaint,
      }),
      ...(parsed.notes !== undefined && { notes: parsed.notes }),
    }));
    const filledFields = Object.keys(parsed).length;
    setParseMsg(
      filledFields > 0
        ? `✓ Filled ${filledFields} field${filledFields !== 1 ? "s" : ""}`
        : "No fields detected",
    );
    setTimeout(() => setParseMsg(""), 3000);
  };

  const toggleVoice = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please use Chrome.",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setQuickFill((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

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
    if (!form.mrn || !form.petName) return;

    const taskStatus = buildTaskStatusFromSelected(form.selectedTasks);

    try {
      await createCase.mutateAsync({
        mrn: form.mrn,
        arrivalDate: form.arrivalDate,
        petName: form.petName,
        ownerLastName: form.ownerLastName,
        species: form.species,
        breed: form.breed,
        sex: form.sex,
        dateOfBirth: form.dateOfBirth,
        presentingComplaint: form.presentingComplaint,
        notes: form.notes,
        tasks: taskStatus,
      });
      setForm(getDefaultForm());
      setQuickFill("");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to create case:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">New Case</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
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

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Quick Fill */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Quick Fill from Text
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    isListening
                      ? "bg-red-100 text-red-600 border border-red-200"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                  title={isListening ? "Stop recording" : "Start voice input"}
                >
                  <svg
                    className={`w-3.5 h-3.5 ${isListening ? "animate-pulse" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                    role="presentation"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  {isListening ? "Stop" : "Voice"}
                </button>
                <button
                  type="button"
                  onClick={handleParseAndFill}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                    role="presentation"
                    strokeWidth="2"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Parse & Fill
                </button>
              </div>
            </div>
            <textarea
              value={quickFill}
              onChange={(e) => setQuickFill(e.target.value)}
              placeholder={QUICK_FILL_PLACEHOLDER}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none placeholder-gray-300"
              rows={4}
            />
            {parseMsg && (
              <p className="text-xs text-blue-600 font-medium mt-1">
                {parseMsg}
              </p>
            )}
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} id="new-case-form">
            <div className="grid grid-cols-2 gap-3">
              {/* MRN */}
              <div className="col-span-1">
                <label
                  htmlFor="new-case-mrn"
                  className="field-label block mb-1"
                >
                  MRN *
                </label>
                <input
                  id="new-case-mrn"
                  type="text"
                  value={form.mrn}
                  onChange={(e) => handleMRNChange(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Medical Record #"
                  required
                />
              </div>

              {/* Arrival Date */}
              <div className="col-span-1">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: DateInput is a custom component that manages its own internal input association */}
                <label className="field-label block mb-1">Arrival Date</label>
                <DateInput
                  value={form.arrivalDate}
                  onChange={(v) => setForm((f) => ({ ...f, arrivalDate: v }))}
                  tabIndex={0}
                />
              </div>

              {/* Pet Name */}
              <div className="col-span-1">
                <label
                  htmlFor="new-case-petName"
                  className="field-label block mb-1"
                >
                  Pet Name *
                </label>
                <input
                  id="new-case-petName"
                  ref={petNameRef}
                  type="text"
                  value={form.petName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, petName: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Pet name"
                  required
                />
              </div>

              {/* Owner Last Name */}
              <div className="col-span-1">
                <label
                  htmlFor="new-case-ownerLastName"
                  className="field-label block mb-1"
                >
                  Owner Last Name
                </label>
                <input
                  id="new-case-ownerLastName"
                  type="text"
                  value={form.ownerLastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ownerLastName: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Last name"
                />
              </div>

              {/* Species */}
              <div className="col-span-1">
                <label
                  htmlFor="new-case-species"
                  className="field-label block mb-1"
                >
                  Species
                </label>
                <select
                  id="new-case-species"
                  value={form.species}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      species: e.target.value as Species,
                    }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="canine">Canine</option>
                  <option value="feline">Feline</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Breed */}
              <div className="col-span-1">
                <label
                  htmlFor="new-case-breed"
                  className="field-label block mb-1"
                >
                  Breed
                </label>
                <input
                  id="new-case-breed"
                  type="text"
                  value={form.breed}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, breed: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Breed"
                />
              </div>

              {/* Sex */}
              <div className="col-span-1">
                <label
                  htmlFor="new-case-sex"
                  className="field-label block mb-1"
                >
                  Sex
                </label>
                <select
                  id="new-case-sex"
                  value={form.sex}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sex: e.target.value as Sex }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="male">Male</option>
                  <option value="maleNeutered">Male Neutered</option>
                  <option value="female">Female</option>
                  <option value="femaleSpayed">Female Spayed</option>
                </select>
              </div>

              {/* DOB */}
              <div className="col-span-1">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: DateInput is a custom component that manages its own internal input association */}
                <label className="field-label block mb-1">Date of Birth</label>
                <DateInput
                  value={form.dateOfBirth}
                  onChange={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))}
                />
              </div>

              {/* Presenting Complaint */}
              <div className="col-span-2">
                <label
                  htmlFor="new-case-complaint"
                  className="field-label block mb-1"
                >
                  Presenting Complaint
                </label>
                <textarea
                  id="new-case-complaint"
                  value={form.presentingComplaint}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      presentingComplaint: e.target.value,
                    }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  rows={2}
                  placeholder="Chief complaint / reason for visit"
                />
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <label
                  htmlFor="new-case-notes"
                  className="field-label block mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="new-case-notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  rows={2}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            {/* Tasks */}
            <div className="mt-4 col-span-2">
              {/* biome-ignore lint/a11y/noLabelWithoutControl: group label for checkbox list, not associated with a single control */}
              <label
                className="field-label block mb-1"
                aria-label="Tasks to complete"
              >
                Tasks to Complete
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Check all tasks that need to be done for this case.
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
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400 cursor-pointer"
                    />
                    <span className="text-xs text-gray-700 group-hover:text-gray-900 transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-case-form"
            disabled={createCase.isPending || !form.mrn || !form.petName}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createCase.isPending ? (
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
                Creating...
              </>
            ) : (
              "Create Case"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
