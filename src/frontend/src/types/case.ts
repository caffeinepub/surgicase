export type Species = "canine" | "feline" | "other";

export type Sex = "male" | "maleNeutered" | "female" | "femaleSpayed";

export type TaskKey =
  | "dischargeNotes"
  | "pDVMNotified"
  | "labs"
  | "histo"
  | "surgeryReport"
  | "imaging"
  | "culture"
  | "dailySummary";

export interface TaskStatus {
  dischargeNotes: boolean;
  pDVMNotified: boolean;
  labs: boolean;
  histo: boolean;
  surgeryReport: boolean;
  imaging: boolean;
  culture: boolean;
  dailySummary: boolean;
}

export const DEFAULT_TASKS: TaskStatus = {
  dischargeNotes: false,
  pDVMNotified: false,
  labs: false,
  histo: false,
  surgeryReport: false,
  imaging: false,
  culture: false,
  dailySummary: false,
};

export interface VetCase {
  caseId: bigint;
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
  appointments: bigint[];
}

export const ALL_TASK_KEYS: TaskKey[] = [
  "dischargeNotes",
  "pDVMNotified",
  "labs",
  "histo",
  "surgeryReport",
  "imaging",
  "culture",
  "dailySummary",
];

export function areAllTasksComplete(tasks: TaskStatus): boolean {
  return ALL_TASK_KEYS.every((k) => tasks[k]);
}
