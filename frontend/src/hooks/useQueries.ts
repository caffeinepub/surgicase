import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { VetCase, TaskStatus, Species, Sex } from '../types/case';
import type { Case, Task, UserProfile } from '../backend';
import { Species as BackendSpecies, Sex as BackendSex } from '../backend';

// ─── Type Converters ────────────────────────────────────────────────────────

function backendCaseToVetCase(c: Case): VetCase {
    const speciesMap: Record<string, Species> = {
        canine: 'canine',
        feline: 'feline',
        other: 'other',
    };
    const sexMap: Record<string, Sex> = {
        male: 'male',
        maleNeutered: 'maleNeutered',
        female: 'female',
        femaleSpayed: 'femaleSpayed',
    };

    return {
        caseId: c.caseId,
        mrn: c.mrn,
        arrivalDate: c.arrivalDate,
        petName: c.petName,
        ownerLastName: c.ownerLastName,
        species: speciesMap[c.species] ?? 'other',
        breed: c.breed,
        sex: sexMap[c.sex] ?? 'male',
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

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useGetCases() {
    const { actor, isFetching: actorFetching } = useActor();

    return useQuery<VetCase[]>({
        queryKey: ['cases'],
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
        queryKey: ['case-by-mrn', mrn],
        queryFn: async () => {
            if (!actor || !mrn) return null;
            try {
                const c = await actor.getCaseByMRN(mrn);
                return backendCaseToVetCase(c);
            } catch {
                return null;
            }
        },
        enabled: !!actor && !actorFetching && mrn.length > 0,
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
            if (!actor) throw new Error('Actor not available');
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
                toBackendTasks(input.tasks)
            );
            return caseId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
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
            if (!actor) throw new Error('Actor not available');
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
                toBackendTasks(input.tasks)
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
        },
    });
}

export function useDeleteCase() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (caseId: bigint) => {
            if (!actor) throw new Error('Actor not available');
            await actor.deleteCase(caseId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
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
            if (!actor) throw new Error('Actor not available');
            await actor.toggleTaskComplete(input.caseId, input.taskName, input.isCompleted);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
        },
    });
}

// ─── User Profile Hooks ──────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
    const { actor, isFetching: actorFetching } = useActor();

    const query = useQuery<UserProfile | null>({
        queryKey: ['currentUserProfile'],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
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
            if (!actor) throw new Error('Actor not available');
            await actor.saveCallerUserProfile(profile);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        },
    });
}
