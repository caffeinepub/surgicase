import type { VetCase } from "../types/case";
import { areAllTasksComplete } from "../types/case";
import { calculateAge } from "./dateUtils";

const SEX_LABELS: Record<string, string> = {
  male: "Male",
  maleNeutered: "Male Neutered",
  female: "Female",
  femaleSpayed: "Female Spayed",
};

const SPECIES_LABELS: Record<string, string> = {
  canine: "Canine",
  feline: "Feline",
  other: "Other",
};

const TASK_LABELS: Record<string, string> = {
  dischargeNotes: "Discharge Notes",
  pDVMNotified: "pDVM Notified",
  labs: "Labs",
  histo: "Histo",
  surgeryReport: "Surgery Report",
  imaging: "Imaging",
  culture: "Culture",
  dailySummary: "Daily Summary",
};

// Load jsPDF dynamically from CDN
async function loadJsPDF(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).jspdf) {
      resolve((window as any).jspdf.jsPDF);
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => {
      if ((window as any).jspdf) {
        resolve((window as any).jspdf.jsPDF);
      } else {
        reject(new Error("jsPDF failed to load"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load jsPDF"));
    document.head.appendChild(script);
  });
}

export async function exportToPDF(
  cases: VetCase[],
  title = "SurgiCase Report",
): Promise<void> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.text(title, margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${dateStr}`, margin, y);
  y += 4;
  doc.text(`Total Cases: ${cases.length}`, margin, y);
  y += 8;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    const allComplete = areAllTasksComplete(c.tasks);

    // Check if we need a new page
    if (y > 240) {
      doc.addPage();
      y = margin;
    }

    // Case header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(`MRN: ${c.mrn}  —  ${c.petName}`, margin, y);

    if (allComplete) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text("✓ COMPLETE", pageWidth - margin - 25, y);
    }
    y += 5;

    // Case details
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    const details = [
      [
        `Owner: ${c.ownerLastName}`,
        `Species: ${SPECIES_LABELS[c.species] || c.species}`,
      ],
      [`Breed: ${c.breed}`, `Sex: ${SEX_LABELS[c.sex] || c.sex}`],
      [
        `Arrival: ${c.arrivalDate}`,
        `DOB: ${c.dateOfBirth}  Age: ${calculateAge(c.dateOfBirth)}`,
      ],
    ];

    for (const row of details) {
      doc.text(row[0], margin, y);
      doc.text(row[1], margin + contentWidth / 2, y);
      y += 4.5;
    }

    if (c.presentingComplaint) {
      y += 1;
      doc.setFont("helvetica", "bold");
      doc.text("Complaint:", margin, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(
        c.presentingComplaint,
        contentWidth - 25,
      );
      doc.text(lines, margin + 22, y);
      y += lines.length * 4.5;
    }

    if (c.notes) {
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", margin, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(c.notes, contentWidth - 18);
      doc.text(lines, margin + 18, y);
      y += lines.length * 4.5;
    }

    // Tasks table
    y += 2;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Tasks:", margin, y);
    y += 4;

    const taskKeys = Object.keys(TASK_LABELS) as (keyof typeof TASK_LABELS)[];
    const colWidth = contentWidth / 4;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        const idx = row * 4 + col;
        if (idx >= taskKeys.length) break;
        const key = taskKeys[idx];
        const done = c.tasks[key as keyof typeof c.tasks];
        const x = margin + col * colWidth;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(done ? 22 : 150, done ? 163 : 150, done ? 74 : 150);
        doc.text(`${done ? "✓" : "○"} ${TASK_LABELS[key]}`, x, y);
      }
      y += 4.5;
    }

    y += 4;

    // Divider between cases
    if (i < cases.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    }
  }

  doc.save(`surgicase-report-${new Date().toISOString().split("T")[0]}.pdf`);
}
