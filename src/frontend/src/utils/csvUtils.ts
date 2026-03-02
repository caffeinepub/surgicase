import type { Sex, Species, TaskStatus, VetCase } from "../types/case";

const CSV_HEADERS = [
  "Medical Record #",
  "Arrival Date",
  "Pet Name",
  "Owner Last Name",
  "Species",
  "Breed",
  "Sex",
  "Date of Birth",
  "Presenting Complaint",
  "Notes",
  "Discharge Notes",
  "pDVM Notified",
  "Labs",
  "Histo",
  "Surgery Report",
  "Imaging",
  "Culture",
  "Daily Summary",
];

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCSV(cases: VetCase[]): string {
  const rows: string[] = [CSV_HEADERS.join(",")];

  for (const c of cases) {
    const row = [
      c.mrn,
      c.arrivalDate,
      c.petName,
      c.ownerLastName,
      c.species,
      c.breed,
      c.sex,
      c.dateOfBirth,
      c.presentingComplaint,
      c.notes,
      c.tasks.dischargeNotes ? "TRUE" : "FALSE",
      c.tasks.pDVMNotified ? "TRUE" : "FALSE",
      c.tasks.labs ? "TRUE" : "FALSE",
      c.tasks.histo ? "TRUE" : "FALSE",
      c.tasks.surgeryReport ? "TRUE" : "FALSE",
      c.tasks.imaging ? "TRUE" : "FALSE",
      c.tasks.culture ? "TRUE" : "FALSE",
      c.tasks.dailySummary ? "TRUE" : "FALSE",
    ].map(escapeCsvField);
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

export function downloadCSV(
  cases: VetCase[],
  filename = "surgicase-export.csv",
): void {
  const csv = exportToCSV(cases);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importFromCSV(csvText: string): VetCase[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  // Skip header row
  const dataLines = lines.slice(1);
  const cases: VetCase[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    const fields = parseCsvLine(line);
    if (fields.length < 18) continue;

    const [
      mrn,
      arrivalDate,
      petName,
      ownerLastName,
      speciesRaw,
      breed,
      sexRaw,
      dateOfBirth,
      presentingComplaint,
      notes,
      dischargeNotes,
      pDVMNotified,
      labs,
      histo,
      surgeryReport,
      imaging,
      culture,
      dailySummary,
    ] = fields;

    const tasks: TaskStatus = {
      dischargeNotes: dischargeNotes?.toUpperCase() === "TRUE",
      pDVMNotified: pDVMNotified?.toUpperCase() === "TRUE",
      labs: labs?.toUpperCase() === "TRUE",
      histo: histo?.toUpperCase() === "TRUE",
      surgeryReport: surgeryReport?.toUpperCase() === "TRUE",
      imaging: imaging?.toUpperCase() === "TRUE",
      culture: culture?.toUpperCase() === "TRUE",
      dailySummary: dailySummary?.toUpperCase() === "TRUE",
    };

    const validSpecies: Species[] = ["canine", "feline", "other"];
    const species: Species = validSpecies.includes(speciesRaw as Species)
      ? (speciesRaw as Species)
      : "other";

    const validSex: Sex[] = ["male", "maleNeutered", "female", "femaleSpayed"];
    const sex: Sex = validSex.includes(sexRaw as Sex)
      ? (sexRaw as Sex)
      : "male";

    cases.push({
      caseId: BigInt(i + 1),
      mrn,
      arrivalDate,
      petName,
      ownerLastName,
      species,
      breed,
      sex,
      dateOfBirth,
      presentingComplaint,
      notes,
      tasks,
      appointments: [],
    });
  }

  return cases;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}
