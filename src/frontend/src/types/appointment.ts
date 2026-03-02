import type { Sex, Species, TaskStatus } from "./case";

export interface VetAppointment {
  appointmentId: bigint;
  caseId: bigint;
  patientName: string;
  ownerName: string;
  species: Species;
  sex: Sex;
  breed: string;
  mrn: string;
  arrivalDate: string;
  reason: string;
  tasks: TaskStatus;
  dateOfBirth: string;
}
