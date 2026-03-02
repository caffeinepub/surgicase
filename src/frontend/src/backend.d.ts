import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Task {
    histo: boolean;
    labs: boolean;
    culture: boolean;
    pDVMNotified: boolean;
    dailySummary: boolean;
    surgeryReport: boolean;
    imaging: boolean;
    dischargeNotes: boolean;
}
export interface Appointment {
    mrn: string;
    sex: Sex;
    tasks: Task;
    ownerName: string;
    arrivalDate: string;
    dateOfBirth: string;
    patientName: string;
    breed: string;
    caseId?: bigint;
    species: Species;
    appointmentId: bigint;
    reason: string;
}
export interface UserProfile {
    name: string;
}
export interface Case {
    mrn: string;
    sex: Sex;
    tasks: Task;
    arrivalDate: string;
    presentingComplaint: string;
    dateOfBirth: string;
    petName: string;
    appointments: Array<bigint>;
    notes: string;
    ownerLastName: string;
    breed: string;
    caseId: bigint;
    species: Species;
}
export enum Sex {
    female = "female",
    male = "male",
    femaleSpayed = "femaleSpayed",
    maleNeutered = "maleNeutered"
}
export enum Species {
    other = "other",
    feline = "feline",
    canine = "canine"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAppointment(patientName: string, ownerName: string, species: Species, sex: Sex, breed: string, mrn: string, arrivalDate: string, reason: string, dateOfBirth: string, tasks: Task): Promise<void>;
    createCase(mrn: string, arrivalDate: string, petName: string, ownerLastName: string, species: Species, breed: string, sex: Sex, dateOfBirth: string, presentingComplaint: string, notes: string, tasks: Task): Promise<bigint>;
    deleteAppointment(appointmentId: bigint): Promise<boolean>;
    deleteCase(caseId: bigint): Promise<void>;
    getAppointmentById(appointmentId: bigint): Promise<Appointment>;
    getAppointments(): Promise<Array<Appointment>>;
    getAppointmentsByMRN(mrn: string): Promise<Array<Appointment>>;
    getAppointmentsByPatientName(patientName: string): Promise<Array<Appointment>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCaseById(caseId: bigint): Promise<Case>;
    getCaseByMRN(mrn: string): Promise<Case>;
    getCases(): Promise<Array<Case>>;
    getTasksForAppointment(appointmentId: bigint): Promise<Task>;
    getTasksForCase(caseId: bigint): Promise<Task>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleAppointmentTaskComplete(appointmentId: bigint, taskName: string, isCompleted: boolean): Promise<void>;
    toggleTaskComplete(caseId: bigint, taskName: string, isCompleted: boolean): Promise<void>;
    updateAppointment(appointmentId: bigint, patientName: string, ownerName: string, species: Species, sex: Sex, breed: string, mrn: string, arrivalDate: string, reason: string, dateOfBirth: string, tasks: Task): Promise<void>;
    updateCase(caseId: bigint, mrn: string, arrivalDate: string, petName: string, ownerLastName: string, species: Species, breed: string, sex: Sex, dateOfBirth: string, presentingComplaint: string, notes: string, tasks: Task): Promise<void>;
}
