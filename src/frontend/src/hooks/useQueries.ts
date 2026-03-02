import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Appointment, Case, Task, UserProfile } from "../backend";
import { Sex as BackendSex, Species as BackendSpecies } from "../backend";
import type { VetAppointment } from "../types/appointment";
import type { Sex, Species, TaskStatus, VetCase } from "../types/case";
import { useActor } from "./useActor";

// ─── Type Converters ────────────────────────────────────────────────────────

function backendCaseToVetCase(c: Case): VetCase {
  const speciesMap: Record<string, Species> = {
    canine: "canine",
    feline: "feline",
    other: "other",
  };
  const sexMap: Record<string, Sex> = {
    male: "male",
    maleNeutered: "maleNeutered",
    female: "female",
    femaleSpayed: "femaleSpayed",
  };

  return {
    caseId: c.caseId,
    mrn: c.mrn,
    arrivalDate: c.arrivalDate,
    petName: c.petName,
    ownerLastName: c.ownerLastName,
    species: speciesMap[c.species] ?? "other",
    breed: c.breed,
    sex: sexMap[c.sex] ?? "male",
    dateOfBirth: c.dateOfBirth,
    presentingComplaint: c.presentingComplaint,
    notes: c.notes,
    tasks: {
      dischargeNotes: c.tasks.dischargeNotes,
      pDVMNotified: c.tasks.pDVMNotified,
      labs: c.tasks.labs,
      histo: c.tasks.histo,
      surgeryReport: c.tasks.surgeryReport,
      imaging: c.tasks.imaging,
      culture: c.tasks.culture,
      dailySummary: c.tasks.dailySummary,
    },
    appointments: c.appointments,
  };
}

function backendTaskToTaskStatus(t: Task): TaskStatus {
  return {
    dischargeNotes: t.dischargeNotes,
    pDVMNotified: t.pDVMNotified,
    labs: t.labs,
    histo: t.histo,
    surgeryReport: t.surgeryReport,
    imaging: t.imaging,
    culture: t.culture,
    dailySummary: t.dailySummary,
  };
}

function backendAppointmentToVetAppointment(a: Appointment): VetAppointment {
  const speciesMap: Record<string, Species> = {
    canine: "canine",
    feline: "feline",
    other: "other",
  };
  const sexMap: Record<string, Sex> = {
    male: "male",
    maleNeutered: "maleNeutered",
    female: "female",
    femaleSpayed: "femaleSpayed",
  };
  return {
    appointmentId: a.appointmentId,
    caseId: a.caseId ?? 0n,
    patientName: a.patientName,
    ownerName: a.ownerName,
    species: speciesMap[a.species] ?? "other",
    sex: sexMap[a.sex] ?? "male",
    breed: a.breed,
    mrn: a.mrn,
    arrivalDate: a.arrivalDate,
    reason: a.reason,
    dateOfBirth: a.dateOfBirth,
    tasks: backendTaskToTaskStatus(a.tasks),
  };
}

function toBackendSpecies(s: Species): BackendSpecies {
  const map: Record<Species, BackendSpecies> = {
    canine: BackendSpecies.canine,
    feline: BackendSpecies.feline,
    other: BackendSpecies.other,
  };
  return map[s];
}

function toBackendSex(s: Sex): BackendSex {
  const map: Record<Sex, BackendSex> = {
    male: BackendSex.male,
    maleNeutered: BackendSex.maleNeutered,
    female: BackendSex.female,
    femaleSpayed: BackendSex.femaleSpayed,
  };
  return map[s];
}

function toBackendTasks(t: TaskStatus): Task {
  return {
    dischargeNotes: t.dischargeNotes,
    pDVMNotified: t.pDVMNotified,
    labs: t.labs,
    histo: t.histo,
    surgeryReport: t.surgeryReport,
    imaging: t.imaging,
    culture: t.culture,
    dailySummary: t.dailySummary,
  };
}

// ─── Case Hooks ──────────────────────────────────────────────────────────────

export function useGetCases() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VetCase[]>({
    queryKey: ["cases"],
    queryFn: async () => {
      if (!actor) return [];
      const cases = await actor.getCases();
      return cases.map(backendCaseToVetCase);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCaseByMRN(mrn: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VetCase | null>({
    queryKey: ["case-by-mrn", mrn],
    queryFn: async () => {
      if (!actor || !mrn.trim()) return null;
      try {
        const c = await actor.getCaseByMRN(mrn.trim());
        return backendCaseToVetCase(c);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && mrn.trim().length > 0,
    retry: false,
  });
}

export interface CreateCaseInput {
  mrn: string;
  arrivalDate: string;
  petName: string;
  ownerLastName: string;
  species: Species;
  breed: string;
  sex: Sex;
  dateOfBirth: string;
  presentingComplaint: string;
  notes: string;
  tasks: TaskStatus;
}

export function useCreateCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCaseInput) => {
      if (!actor) throw new Error("Actor not available");
      const caseId = await actor.createCase(
        input.mrn,
        input.arrivalDate,
        input.petName,
        input.ownerLastName,
        toBackendSpecies(input.species),
        input.breed,
        toBackendSex(input.sex),
        input.dateOfBirth,
        input.presentingComplaint,
        input.notes,
        toBackendTasks(input.tasks),
      );
      return caseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case-by-mrn"] });
    },
  });
}

export interface UpdateCaseInput extends CreateCaseInput {
  caseId: bigint;
}

export function useUpdateCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCaseInput) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateCase(
        input.caseId,
        input.mrn,
        input.arrivalDate,
        input.petName,
        input.ownerLastName,
        toBackendSpecies(input.species),
        input.breed,
        toBackendSex(input.sex),
        input.dateOfBirth,
        input.presentingComplaint,
        input.notes,
        toBackendTasks(input.tasks),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case-by-mrn"] });
    },
  });
}

export function useDeleteCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteCase(caseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export interface ToggleTaskInput {
  caseId: bigint;
  taskName: string;
  isCompleted: boolean;
}

export function useToggleTaskComplete() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ToggleTaskInput) => {
      if (!actor) throw new Error("Actor not available");
      await actor.toggleTaskComplete(
        input.caseId,
        input.taskName,
        input.isCompleted,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

// ─── Appointment Hooks ───────────────────────────────────────────────────────

export function useGetAppointments() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VetAppointment[]>({
    queryKey: ["appointments"],
    queryFn: async () => {
      if (!actor) return [];
      const appts = await actor.getAppointments();
      return appts.map(backendAppointmentToVetAppointment);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAppointmentsByMRN(mrn: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VetAppointment[]>({
    queryKey: ["appointments-by-mrn", mrn],
    queryFn: async () => {
      if (!actor || !mrn.trim()) return [];
      const appts = await actor.getAppointmentsByMRN(mrn.trim());
      return appts.map(backendAppointmentToVetAppointment);
    },
    enabled: !!actor && !actorFetching && mrn.trim().length > 0,
  });
}

export interface CreateAppointmentInput {
  patientName: string;
  ownerName: string;
  species: Species;
  sex: Sex;
  breed: string;
  mrn: string;
  arrivalDate: string;
  reason: string;
  dateOfBirth: string;
  tasks: TaskStatus;
}

export function useCreateAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      if (!actor) throw new Error("Actor not available");
      await actor.createAppointment(
        input.patientName,
        input.ownerName,
        toBackendSpecies(input.species),
        toBackendSex(input.sex),
        input.breed,
        input.mrn,
        input.arrivalDate,
        input.reason,
        input.dateOfBirth,
        toBackendTasks(input.tasks),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-by-mrn"] });
      queryClient.invalidateQueries({ queryKey: ["case-by-mrn"] });
    },
  });
}

export interface UpdateAppointmentInput {
  appointmentId: bigint;
  patientName: string;
  ownerName: string;
  species: Species;
  sex: Sex;
  breed: string;
  mrn: string;
  arrivalDate: string;
  reason: string;
  dateOfBirth: string;
  tasks: TaskStatus;
}

export function useUpdateAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAppointmentInput) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateAppointment(
        input.appointmentId,
        input.patientName,
        input.ownerName,
        toBackendSpecies(input.species),
        toBackendSex(input.sex),
        input.breed,
        input.mrn,
        input.arrivalDate,
        input.reason,
        input.dateOfBirth,
        toBackendTasks(input.tasks),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-by-mrn"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case-by-mrn"] });
    },
  });
}

export function useDeleteAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteAppointment(appointmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-by-mrn"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export interface UpdateAppointmentTaskInput {
  appointmentId: bigint;
  taskName: string;
  isCompleted: boolean;
}

export function useUpdateAppointmentTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAppointmentTaskInput) => {
      if (!actor) throw new Error("Actor not available");
      await actor.toggleAppointmentTaskComplete(
        input.appointmentId,
        input.taskName,
        input.isCompleted,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-by-mrn"] });
    },
  });
}

// ─── User Profile Hooks ──────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}
