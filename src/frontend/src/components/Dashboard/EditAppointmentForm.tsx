import type React from "react";
import { useState } from "react";
import { useUpdateAppointment } from "../../hooks/useQueries";
import type { VetAppointment } from "../../types/appointment";
import type { Sex, Species, TaskStatus } from "../../types/case";
import DateInput from "../shared/DateInput";

interface EditAppointmentFormProps {
  appointment: VetAppointment;
  onClose: () => void;
  onSuccess?: () => void;
}

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

export default function EditAppointmentForm({
  appointment,
  onClose,
  onSuccess,
}: EditAppointmentFormProps) {
  const [form, setForm] = useState({
    patientName: appointment.patientName,
    ownerName: appointment.ownerName,
    species: appointment.species,
    sex: appointment.sex,
    breed: appointment.breed,
    mrn: appointment.mrn,
    arrivalDate: appointment.arrivalDate,
    reason: appointment.reason,
    dateOfBirth: appointment.dateOfBirth,
    tasks: { ...appointment.tasks },
  });
  const [successMsg, setSuccessMsg] = useState("");

  const updateAppointment = useUpdateAppointment();

  const handleTaskToggle = (key: keyof TaskStatus) => {
    setForm((f) => ({
      ...f,
      tasks: { ...f.tasks, [key]: !f.tasks[key] },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName || !form.mrn) return;

    try {
      await updateAppointment.mutateAsync({
        appointmentId: appointment.appointmentId,
        patientName: form.patientName,
        ownerName: form.ownerName,
        species: form.species,
        sex: form.sex,
        breed: form.breed,
        mrn: form.mrn,
        arrivalDate: form.arrivalDate,
        reason: form.reason,
        dateOfBirth: form.dateOfBirth,
        tasks: form.tasks,
      });
      setSuccessMsg("Appointment updated successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Failed to update appointment:", err);
    }
  };

  const isSubmitting = updateAppointment.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                role="presentation"
              >
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Edit Appointment
            </h2>
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

          {updateAppointment.isError && (
            <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg
                className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
                role="presentation"
              >
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm text-red-700 font-medium">
                Failed to update appointment. Please try again.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} id="edit-appointment-form">
            <div className="grid grid-cols-2 gap-3">
              {/* Patient Name */}
              <div className="col-span-1">
                <label
                  htmlFor="edit-appt-patientName"
                  className="field-label block mb-1"
                >
                  Patient Name *
                </label>
                <input
                  id="edit-appt-patientName"
                  type="text"
                  value={form.patientName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, patientName: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Pet name"
                  required
                />
              </div>

              {/* MRN */}
              <div className="col-span-1">
                <label
                  htmlFor="edit-appt-mrn"
                  className="field-label block mb-1"
                >
                  MRN *
                </label>
                <input
                  id="edit-appt-mrn"
                  type="text"
                  value={form.mrn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mrn: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Medical Record #"
                  required
                />
              </div>

              {/* Owner Name */}
              <div className="col-span-2">
                <label
                  htmlFor="edit-appt-ownerName"
                  className="field-label block mb-1"
                >
                  Owner Name
                </label>
                <input
                  id="edit-appt-ownerName"
                  type="text"
                  value={form.ownerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ownerName: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Owner last name"
                />
              </div>

              {/* Species */}
              <div className="col-span-1">
                <label
                  htmlFor="edit-appt-species"
                  className="field-label block mb-1"
                >
                  Species
                </label>
                <select
                  id="edit-appt-species"
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

              {/* Sex */}
              <div className="col-span-1">
                <label
                  htmlFor="edit-appt-sex"
                  className="field-label block mb-1"
                >
                  Sex
                </label>
                <select
                  id="edit-appt-sex"
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

              {/* Breed */}
              <div className="col-span-2">
                <label
                  htmlFor="edit-appt-breed"
                  className="field-label block mb-1"
                >
                  Breed
                </label>
                <input
                  id="edit-appt-breed"
                  type="text"
                  value={form.breed}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, breed: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Breed"
                />
              </div>

              {/* Date of Birth */}
              <div className="col-span-1">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: DateInput is a custom component that manages its own internal input association */}
                <label className="field-label block mb-1">Date of Birth</label>
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
                  Appointment Date
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
                  htmlFor="edit-appt-reason"
                  className="field-label block mb-1"
                >
                  Reason for Visit
                </label>
                <textarea
                  id="edit-appt-reason"
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  placeholder="Describe the reason for this appointment..."
                  rows={3}
                />
              </div>

              {/* Tasks */}
              <div className="col-span-2">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: group label for checkbox list, not associated with a single control */}
                <label
                  className="field-label block mb-1"
                  aria-label="Task completion status"
                >
                  Task Status
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Check tasks that have been completed.
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {TASK_LABELS.map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={form.tasks[key]}
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
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 flex-shrink-0">
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
            form="edit-appointment-form"
            disabled={isSubmitting || !form.patientName || !form.mrn}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                Saving...
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
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
