import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateCase } from "@/hooks/useQueries";
import type { Sex, Species, TaskStatus, VetCase } from "@/types/case";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

interface EditCaseFormProps {
  vetCase: VetCase;
  open: boolean;
  onClose: () => void;
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

export default function EditCaseForm({
  vetCase,
  open,
  onClose,
}: EditCaseFormProps) {
  const updateCase = useUpdateCase();

  const [mrn, setMrn] = useState(vetCase.mrn);
  const [petName, setPetName] = useState(vetCase.petName);
  const [ownerLastName, setOwnerLastName] = useState(vetCase.ownerLastName);
  const [species, setSpecies] = useState<Species>(vetCase.species);
  const [breed, setBreed] = useState(vetCase.breed);
  const [sex, setSex] = useState<Sex>(vetCase.sex);
  const [dateOfBirth, setDateOfBirth] = useState(vetCase.dateOfBirth);
  const [presentingComplaint, setPresentingComplaint] = useState(
    vetCase.presentingComplaint,
  );
  const [notes, setNotes] = useState(vetCase.notes);
  const [tasks, setTasks] = useState<TaskStatus>({ ...vetCase.tasks });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when vetCase changes (e.g. after a successful save)
  // biome-ignore lint/correctness/useExhaustiveDependencies: `open` is intentionally included to reset when dialog re-opens
  React.useEffect(() => {
    setMrn(vetCase.mrn);
    setPetName(vetCase.petName);
    setOwnerLastName(vetCase.ownerLastName);
    setSpecies(vetCase.species);
    setBreed(vetCase.breed);
    setSex(vetCase.sex);
    setDateOfBirth(vetCase.dateOfBirth);
    setPresentingComplaint(vetCase.presentingComplaint);
    setNotes(vetCase.notes);
    setTasks({ ...vetCase.tasks });
    setErrors({});
  }, [vetCase, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!mrn.trim()) newErrors.mrn = "MRN is required";
    if (!petName.trim()) newErrors.petName = "Patient name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await updateCase.mutateAsync({
        caseId: vetCase.caseId,
        mrn: mrn.trim(),
        arrivalDate: vetCase.arrivalDate,
        petName: petName.trim(),
        ownerLastName: ownerLastName.trim(),
        species,
        breed: breed.trim(),
        sex,
        dateOfBirth: dateOfBirth.trim(),
        presentingComplaint: presentingComplaint.trim(),
        notes: notes.trim(),
        tasks,
      });
      onClose();
    } catch {
      // error surfaced via mutation state
    }
  };

  const toggleTask = (key: keyof TaskStatus) => {
    setTasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient Card</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Row 1: MRN + Pet Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="edit-mrn">
                MRN <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-mrn"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                placeholder="e.g. MRN-001"
              />
              {errors.mrn && (
                <p className="text-xs text-destructive">{errors.mrn}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-petName">
                Patient Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-petName"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="e.g. Buddy"
              />
              {errors.petName && (
                <p className="text-xs text-destructive">{errors.petName}</p>
              )}
            </div>
          </div>

          {/* Row 2: Owner Last Name + Date of Birth */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="edit-ownerLastName">Owner Last Name</Label>
              <Input
                id="edit-ownerLastName"
                value={ownerLastName}
                onChange={(e) => setOwnerLastName(e.target.value)}
                placeholder="e.g. Smith"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="MM/DD/YYYY"
              />
            </div>
          </div>

          {/* Row 3: Species + Sex + Breed */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Species</Label>
              <Select
                value={species}
                onValueChange={(v) => setSpecies(v as Species)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="canine">Canine</SelectItem>
                  <SelectItem value="feline">Feline</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sex</Label>
              <Select value={sex} onValueChange={(v) => setSex(v as Sex)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male (Intact)</SelectItem>
                  <SelectItem value="maleNeutered">Male (Neutered)</SelectItem>
                  <SelectItem value="female">Female (Intact)</SelectItem>
                  <SelectItem value="femaleSpayed">Female (Spayed)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-breed">Breed</Label>
              <Input
                id="edit-breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g. Labrador"
              />
            </div>
          </div>

          {/* Presenting Complaint */}
          <div className="space-y-1">
            <Label htmlFor="edit-complaint">Presenting Complaint</Label>
            <Textarea
              id="edit-complaint"
              value={presentingComplaint}
              onChange={(e) => setPresentingComplaint(e.target.value)}
              placeholder="Describe the presenting complaint..."
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            <Label>Tasks</Label>
            <div className="grid grid-cols-2 gap-2">
              {TASK_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-task-${key}`}
                    checked={tasks[key]}
                    onCheckedChange={() => toggleTask(key)}
                  />
                  <label
                    htmlFor={`edit-task-${key}`}
                    className="text-sm cursor-pointer select-none"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {updateCase.isError && (
            <p className="text-sm text-destructive">
              Failed to update case. Please try again.
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateCase.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateCase.isPending}>
              {updateCase.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
