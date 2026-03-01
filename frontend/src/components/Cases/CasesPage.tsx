import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { VetCase } from '../../types/case';
import { areAllTasksComplete } from '../../types/case';
import { useGetCases, useUpdateCase, useDeleteCase, useCreateCase, type UpdateCaseInput, type CreateCaseInput } from '../../hooks/useQueries';
import { exportToPDF } from '../../utils/pdfUtils';
import { downloadCSV, importFromCSV } from '../../utils/csvUtils';
import { parseDate } from '../../utils/dateUtils';
import CaseCard from './CaseCard';
import FilterBar, { type FilterOption, type SortOption } from './FilterBar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CasesPageProps {
    onNewCase: () => void;
    targetCaseId?: bigint | null;
    onTargetCaseHandled?: () => void;
}

function filterCases(cases: VetCase[], filter: FilterOption, search: string): VetCase[] {
    let filtered = cases;

    if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
            (c) =>
                c.petName.toLowerCase().includes(q) ||
                c.mrn.toLowerCase().includes(q) ||
                c.ownerLastName.toLowerCase().includes(q) ||
                c.breed.toLowerCase().includes(q) ||
                c.presentingComplaint.toLowerCase().includes(q)
        );
    }

    switch (filter) {
        case 'complete':
            return filtered.filter((c) => areAllTasksComplete(c.tasks));
        case 'histo':
            return filtered.filter((c) => !c.tasks.histo);
        case 'imaging':
            return filtered.filter((c) => !c.tasks.imaging);
        case 'labs':
            return filtered.filter((c) => !c.tasks.labs);
        case 'culture':
            return filtered.filter((c) => !c.tasks.culture);
        default:
            return filtered;
    }
}

function sortCases(cases: VetCase[], sort: SortOption): VetCase[] {
    return [...cases].sort((a, b) => {
        const dateA = parseDate(a.arrivalDate)?.getTime() ?? 0;
        const dateB = parseDate(b.arrivalDate)?.getTime() ?? 0;
        const dateDiff = sort === 'oldest' ? dateA - dateB : dateB - dateA;
        if (dateDiff !== 0) return dateDiff;
        const incompleteA = Object.values(a.tasks).filter((v) => !v).length;
        const incompleteB = Object.values(b.tasks).filter((v) => !v).length;
        return incompleteB - incompleteA;
    });
}

export default function CasesPage({ onNewCase, targetCaseId, onTargetCaseHandled }: CasesPageProps) {
    const [filter, setFilter] = useState<FilterOption>('all');
    const [sort, setSort] = useState<SortOption>('oldest');
    const [search, setSearch] = useState('');
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
    const [highlightedCaseId, setHighlightedCaseId] = useState<bigint | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const caseCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const { data: cases = [], isLoading, error } = useGetCases();
    const updateCase = useUpdateCase();
    const deleteCase = useDeleteCase();
    const createCase = useCreateCase();

    // When targetCaseId changes, clear filters and scroll/highlight the target card
    useEffect(() => {
        if (!targetCaseId) return;

        // Clear filters so the target case is visible
        setFilter('all');
        setSearch('');

        // Set highlight immediately
        setHighlightedCaseId(targetCaseId);

        // Capture the id in closure for timers
        const capturedId = targetCaseId;

        // Notify parent that we've handled the target (clears it in App.tsx)
        // Do this after a tick so the local state updates first
        const handleTimer = setTimeout(() => {
            onTargetCaseHandled?.();
        }, 50);

        // Attempt scroll with retries to handle cases where refs aren't registered yet
        let attempts = 0;
        const maxAttempts = 10;
        const tryScroll = () => {
            const key = capturedId.toString();
            const el = caseCardRefs.current.get(key);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(tryScroll, 100);
            }
        };
        // Start first scroll attempt after a short delay
        const scrollTimer = setTimeout(tryScroll, 150);

        // Remove highlight after 2.5 seconds
        const highlightTimer = setTimeout(() => {
            setHighlightedCaseId(null);
        }, 2500);

        return () => {
            clearTimeout(handleTimer);
            clearTimeout(scrollTimer);
            clearTimeout(highlightTimer);
        };
    }, [targetCaseId]);

    const processedCases = useMemo(() => {
        const filtered = filterCases(cases, filter, search);
        return sortCases(filtered, sort);
    }, [cases, filter, sort, search]);

    const handleUpdate = useCallback(
        (updated: VetCase) => {
            const input: UpdateCaseInput = {
                caseId: updated.caseId,
                mrn: updated.mrn,
                arrivalDate: updated.arrivalDate,
                petName: updated.petName,
                ownerLastName: updated.ownerLastName,
                species: updated.species,
                breed: updated.breed,
                sex: updated.sex,
                dateOfBirth: updated.dateOfBirth,
                presentingComplaint: updated.presentingComplaint,
                notes: updated.notes,
                tasks: updated.tasks,
            };
            updateCase.mutate(input);
        },
        [updateCase]
    );

    const handleDeleteConfirm = async () => {
        if (deleteTarget === null) return;
        try {
            await deleteCase.mutateAsync(deleteTarget);
        } catch (e) {
            console.error('Delete failed:', e);
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleExportCSV = () => {
        downloadCSV(processedCases);
    };

    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            await exportToPDF(processedCases);
        } catch (e) {
            console.error('PDF export failed:', e);
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

        // Reset file input so the same file can be re-selected
        e.target.value = '';

        setIsImporting(true);
        setImportMessage(null);

        try {
            const text = await file.text();
            const parsed = importFromCSV(text);

            if (parsed.length === 0) {
                setImportMessage({ type: 'error', text: 'No valid cases found in the CSV file.' });
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
                } catch (err) {
                    errors.push(vetCase.mrn || `row ${successCount + errors.length + 1}`);
                }
            }

            if (errors.length === 0) {
                setImportMessage({
                    type: 'success',
                    text: `Successfully imported ${successCount} case${successCount !== 1 ? 's' : ''}.`,
                });
            } else if (successCount > 0) {
                setImportMessage({
                    type: 'error',
                    text: `Imported ${successCount} case${successCount !== 1 ? 's' : ''}, but ${errors.length} failed (MRNs: ${errors.join(', ')}).`,
                });
            } else {
                setImportMessage({ type: 'error', text: 'Import failed. Please check the CSV format and try again.' });
            }
        } catch (err) {
            setImportMessage({ type: 'error', text: 'Failed to read the CSV file. Please ensure it is a valid CSV.' });
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
                        {cases.length} total case{cases.length !== 1 ? 's' : ''}
                        {processedCases.length !== cases.length && ` · ${processedCases.length} shown`}
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
                        onClick={handleImportCSVClick}
                        disabled={isImporting}
                        className="flex items-center gap-1.5 text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isImporting ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        )}
                        {isImporting ? 'Importing...' : 'Import CSV'}
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={processedCases.length === 0}
                        className="flex items-center gap-1.5 text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M12 10v6m0 0-3-3m3 3 3-3M3 17V7a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                        Export CSV
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExportingPDF || processedCases.length === 0}
                        className="flex items-center gap-1.5 text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                    </button>
                    <button
                        onClick={onNewCase}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                        importMessage.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                >
                    {importMessage.type === 'success' ? (
                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    )}
                    <span>{importMessage.text}</span>
                    <button
                        onClick={() => setImportMessage(null)}
                        className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        aria-label="Dismiss"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                        <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-sm text-gray-500">Loading cases...</span>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-red-700">Failed to load cases. Please try again.</p>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && processedCases.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                            <rect x="9" y="3" width="6" height="4" rx="1" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 mb-1">
                        {cases.length === 0 ? 'No cases yet' : 'No cases match your filters'}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                        {cases.length === 0
                            ? 'Create your first case or import from a CSV file'
                            : 'Try adjusting your search or filter criteria'}
                    </p>
                    {cases.length === 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleImportCSVClick}
                                disabled={isImporting}
                                className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Import CSV
                            </button>
                            <button
                                onClick={onNewCase}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                New Case
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Case cards */}
            {!isLoading && !error && processedCases.length > 0 && (
                <div className="space-y-3">
                    {processedCases.map((vetCase) => {
                        const caseIdStr = vetCase.caseId.toString();
                        return (
                            <div
                                key={caseIdStr}
                                ref={(el) => {
                                    if (el) {
                                        caseCardRefs.current.set(caseIdStr, el);
                                    } else {
                                        caseCardRefs.current.delete(caseIdStr);
                                    }
                                }}
                                className={highlightedCaseId === vetCase.caseId ? 'case-highlight' : ''}
                            >
                                <CaseCard
                                    vetCase={vetCase}
                                    onUpdate={handleUpdate}
                                    onDelete={() => setDeleteTarget(vetCase.caseId)}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete confirmation dialog */}
            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Case</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this case? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
