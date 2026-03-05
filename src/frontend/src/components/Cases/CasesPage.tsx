import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TargetCase } from "../../App";
import {
  useCreateCase,
  useDeleteCase,
  useGetCases,
} from "../../hooks/useQueries";
import type { CreateCaseInput } from "../../hooks/useQueries";
import type { VetCase } from "../../types/case";
import { areAllTasksComplete } from "../../types/case";
import { downloadCSV, importFromCSV } from "../../utils/csvUtils";
import { parseDate } from "../../utils/dateUtils";
import { exportToPDF } from "../../utils/pdfUtils";
import CaseCard from "./CaseCard";
import FilterBar, { type FilterOption, type SortOption } from "./FilterBar";
import NewCaseForm from "./NewCaseForm";

interface CasesPageProps {
  targetCase?: TargetCase | null;
  onTargetCaseHandled?: () => void;
}

function filterCases(
  cases: VetCase[],
  filter: FilterOption,
  search: string,
): VetCase[] {
  let filtered = cases;

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.petName.toLowerCase().includes(q) ||
        c.mrn.toLowerCase().includes(q) ||
        c.ownerLastName.toLowerCase().includes(q) ||
        c.breed.toLowerCase().includes(q) ||
        c.presentingComplaint.toLowerCase().includes(q),
    );
  }

  switch (filter) {
    case "complete":
      return filtered.filter((c) => areAllTasksComplete(c.tasks));
    case "histo":
      return filtered.filter((c) => !c.tasks.histo);
    case "imaging":
      return filtered.filter((c) => !c.tasks.imaging);
    case "labs":
      return filtered.filter((c) => !c.tasks.labs);
    case "culture":
      return filtered.filter((c) => !c.tasks.culture);
    default:
      return filtered;
  }
}

function sortCases(cases: VetCase[], sort: SortOption): VetCase[] {
  return [...cases].sort((a, b) => {
    const dateA = parseDate(a.arrivalDate)?.getTime() ?? 0;
    const dateB = parseDate(b.arrivalDate)?.getTime() ?? 0;
    const dateDiff = sort === "oldest" ? dateA - dateB : dateB - dateA;
    if (dateDiff !== 0) return dateDiff;
    const incompleteA = Object.values(a.tasks).filter((v) => !v).length;
    const incompleteB = Object.values(b.tasks).filter((v) => !v).length;
    return incompleteB - incompleteA;
  });
}

export default function CasesPage({
  targetCase,
  onTargetCaseHandled,
}: CasesPageProps) {
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [search, setSearch] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [highlightedCaseId, setHighlightedCaseId] = useState<bigint | null>(
    null,
  );
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const caseCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Track which navigation key we've already handled to avoid double-firing
  const handledKeyRef = useRef<number | null>(null);

  const { data: cases = [], isLoading, error, isFetching } = useGetCases();
  const deleteCase = useDeleteCase();
  const createCase = useCreateCase();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["cases"] });
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["appointments-by-mrn"] });
  };

  // When targetCase changes (new navigation request) or cases finish loading,
  // attempt to scroll to and highlight the target card.
  useEffect(() => {
    if (!targetCase) return;
    // Don't re-handle the same navigation key
    if (handledKeyRef.current === targetCase.key) return;
    // Wait until cases have loaded before attempting scroll
    if (isLoading) return;

    const { caseId, key } = targetCase;

    // Clear filters so the target card is visible
    setFilter("all");
    setSearch("");
    setHighlightedCaseId(caseId);

    // Mark this key as handled so we don't re-run on unrelated re-renders
    handledKeyRef.current = key;

    // Attempt to scroll to the card, retrying until the DOM element appears
    let attempts = 0;
    const maxAttempts = 15;
    let scrollTimer: ReturnType<typeof setTimeout>;

    const tryScroll = () => {
      const el = caseCardRefs.current.get(caseId.toString());
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Signal App.tsx that we're done — do this AFTER scroll is initiated
        onTargetCaseHandled?.();
      } else if (attempts < maxAttempts) {
        attempts++;
        scrollTimer = setTimeout(tryScroll, 120);
      } else {
        // Couldn't find the card (case may not exist), still clear the state
        onTargetCaseHandled?.();
      }
    };

    // Small initial delay to let React finish rendering the new page
    scrollTimer = setTimeout(tryScroll, 80);

    // Remove highlight after animation completes
    const highlightTimer = setTimeout(() => {
      setHighlightedCaseId(null);
    }, 2800);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(highlightTimer);
    };
    // Re-run when targetCase changes OR when loading finishes (cases become available)
  }, [targetCase, isLoading, onTargetCaseHandled]);

  // Reset the handled key when targetCase is cleared so the next navigation works
  useEffect(() => {
    if (!targetCase) {
      handledKeyRef.current = null;
    }
  }, [targetCase]);

  const processedCases = useMemo(() => {
    const filtered = filterCases(cases, filter, search);
    return sortCases(filtered, sort);
  }, [cases, filter, sort, search]);

  const handleDeleteConfirm = useCallback(
    async (caseId: bigint) => {
      try {
        await deleteCase.mutateAsync(caseId);
      } catch (e) {
        console.error("Delete failed:", e);
      }
    },
    [deleteCase],
  );

  const handleExportCSV = () => {
    downloadCSV(processedCases);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportToPDF(processedCases);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleImportCSVClick = () => {
    setImportMessage(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    setIsImporting(true);
    setImportMessage(null);

    try {
      const text = await file.text();
      const parsed = importFromCSV(text);

      if (parsed.length === 0) {
        setImportMessage({
          type: "error",
          text: "No valid cases found in the CSV file.",
        });
        return;
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const vetCase of parsed) {
        const input: CreateCaseInput = {
          mrn: vetCase.mrn,
          arrivalDate: vetCase.arrivalDate,
          petName: vetCase.petName,
          ownerLastName: vetCase.ownerLastName,
          species: vetCase.species,
          breed: vetCase.breed,
          sex: vetCase.sex,
          dateOfBirth: vetCase.dateOfBirth,
          presentingComplaint: vetCase.presentingComplaint,
          notes: vetCase.notes,
          tasks: vetCase.tasks,
        };
        try {
          await createCase.mutateAsync(input);
          successCount++;
        } catch (_err) {
          errors.push(vetCase.mrn || `row ${successCount + errors.length + 1}`);
        }
      }

      if (errors.length === 0) {
        setImportMessage({
          type: "success",
          text: `Successfully imported ${successCount} case${successCount !== 1 ? "s" : ""}.`,
        });
      } else if (successCount > 0) {
        setImportMessage({
          type: "error",
          text: `Imported ${successCount} case${successCount !== 1 ? "s" : ""}, but ${errors.length} failed (MRNs: ${errors.join(", ")}).`,
        });
      } else {
        setImportMessage({
          type: "error",
          text: "Import failed. Please check the CSV format and try again.",
        });
      }
    } catch (_err) {
      setImportMessage({
        type: "error",
        text: "Failed to read the CSV file. Please ensure it is a valid CSV.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cases</h1>
          <p className="text-sm text-gray-500">
            {cases.length} total case{cases.length !== 1 ? "s" : ""}
            {processedCases.length !== cases.length &&
              ` · ${processedCases.length} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hidden file input for CSV import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={handleImportCSVClick}
            disabled={isImporting}
            className="flex items-center gap-1.5 text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? (
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
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                role="presentation"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
            {isImporting ? "Importing..." : "Import CSV"}
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={processedCases.length === 0}
            className="flex items-center gap-1.5 text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              role="presentation"
            >
              <path d="M12 10v6m0 0-3-3m3 3 3-3M3 17V7a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF || processedCases.length === 0}
            className="flex items-center gap-1.5 text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              role="presentation"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {isExportingPDF ? "Exporting..." : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh cases"
            data-ocid="cases.refresh_button"
          >
            <svg
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              role="presentation"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowNewCaseForm(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
              role="presentation"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Case
          </button>
        </div>
      </div>

      {/* Import feedback message */}
      {importMessage && (
        <div
          className={`flex items-start gap-2 rounded-xl px-4 py-3 mb-4 text-sm ${
            importMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {importMessage.type === "success" ? (
            <svg
              className="w-4 h-4 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              role="presentation"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              role="presentation"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <span>{importMessage.text}</span>
          <button
            type="button"
            onClick={() => setImportMessage(null)}
            className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <svg
              className="w-4 h-4"
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
      )}

      {/* Filter bar */}
      <div className="mb-4">
        <FilterBar
          filter={filter}
          sort={sort}
          search={search}
          onFilterChange={setFilter}
          onSortChange={setSort}
          onSearchChange={setSearch}
        />
      </div>

      {/* Cases list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <svg
            className="animate-spin w-6 h-6 text-blue-500"
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
          <span className="text-sm text-gray-500">Loading cases...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-red-500">
            Failed to load cases. Please try again.
          </p>
        </div>
      ) : processedCases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <svg
            className="w-12 h-12 text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            role="presentation"
          >
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-500">No cases found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search || filter !== "all"
                ? "Try adjusting your search or filters"
                : "Schedule an appointment on the Calendar page to create a case"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {processedCases.map((vetCase) => {
            const key = vetCase.caseId.toString();
            const isHighlighted =
              highlightedCaseId !== null &&
              highlightedCaseId === vetCase.caseId;
            return (
              <div
                key={key}
                ref={(el) => {
                  if (el) caseCardRefs.current.set(key, el);
                  else caseCardRefs.current.delete(key);
                }}
              >
                <CaseCard
                  vetCase={vetCase}
                  editable={true}
                  onDelete={() => handleDeleteConfirm(vetCase.caseId)}
                  highlight={isHighlighted}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* New Case Form Modal */}
      {showNewCaseForm && (
        <NewCaseForm
          onClose={() => setShowNewCaseForm(false)}
          onSuccess={() => setShowNewCaseForm(false)}
        />
      )}
    </div>
  );
}
