import React, { useState, useMemo } from 'react';
import type { VetCase } from '../../types/case';
import { useGetCases, useToggleTaskComplete } from '../../hooks/useQueries';
import { parseDate, getWeekDays, formatCalendarDayHeader, isSameDay, isToday } from '../../utils/dateUtils';
import CalendarCaseCard from './CalendarCaseCard';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardPageProps {
    onNewCase: () => void;
    onNavigateToCases: () => void;
    onNavigateToCaseDetail: (caseId: bigint) => void;
}

export default function DashboardPage({ onNewCase, onNavigateToCases, onNavigateToCaseDetail }: DashboardPageProps) {
    const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

    const { data: cases = [], isLoading, error } = useGetCases();
    const toggleTask = useToggleTaskComplete();

    // Compute the 7 days for the displayed week
    const weekDays = useMemo(() => {
        const ref = new Date();
        ref.setDate(ref.getDate() + weekOffset * 7);
        return getWeekDays(ref);
    }, [weekOffset]);

    // Map cases to their day column
    const casesByDay = useMemo(() => {
        return weekDays.map((day) => {
            const dayCases = cases.filter((c) => {
                const d = parseDate(c.arrivalDate);
                return d ? isSameDay(d, day) : false;
            });
            return dayCases;
        });
    }, [cases, weekDays]);

    const totalCasesThisWeek = useMemo(
        () => casesByDay.reduce((sum, arr) => sum + arr.length, 0),
        [casesByDay]
    );

    // Toggle task: pass the new desired state (opposite of current)
    const handleTaskToggle = (caseId: bigint, taskName: string, currentValue: boolean) => {
        toggleTask.mutate({ caseId, taskName, isCompleted: !currentValue });
    };

    // Week label for header
    const weekLabel = useMemo(() => {
        const start = weekDays[0];
        const end = weekDays[6];
        const startStr = `${start.toLocaleString('en-US', { month: 'short' })} ${start.getDate()}`;
        const endStr = `${end.toLocaleString('en-US', { month: 'short' })} ${end.getDate()}, ${end.getFullYear()}`;
        return `${startStr} – ${endStr}`;
    }, [weekDays]);

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full">
                {/* Page header */}
                <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                        <span className="text-sm text-gray-400">{weekLabel}</span>
                        {totalCasesThisWeek > 0 && (
                            <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                                {totalCasesThisWeek} case{totalCasesThisWeek !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Week navigation */}
                        <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setWeekOffset((o) => o - 1)}
                                className="p-1.5 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                                title="Previous week"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setWeekOffset(0)}
                                disabled={weekOffset === 0}
                                className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-x border-gray-200"
                                title="Go to current week"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setWeekOffset((o) => o + 1)}
                                className="p-1.5 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                                title="Next week"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

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
                    <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm text-red-700">Failed to load cases. Please try again.</p>
                    </div>
                )}

                {/* Weekly calendar grid */}
                {!isLoading && !error && (
                    <div className="flex-1 overflow-x-auto">
                        <div className="min-w-[700px] h-full flex flex-col">
                            {/* Day header row */}
                            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                                {weekDays.map((day, i) => {
                                    const { dayName, dateStr } = formatCalendarDayHeader(day);
                                    const today = isToday(day);
                                    const count = casesByDay[i].length;
                                    return (
                                        <div
                                            key={i}
                                            className={`
                                                px-2 py-2 text-center border-r border-gray-200 last:border-r-0
                                                ${today ? 'bg-blue-50' : ''}
                                            `}
                                        >
                                            <div className={`text-xs font-semibold uppercase tracking-wide ${today ? 'text-blue-600' : 'text-gray-500'}`}>
                                                {dayName}
                                            </div>
                                            <div className={`text-sm font-bold ${today ? 'text-blue-700' : 'text-gray-700'}`}>
                                                {dateStr}
                                            </div>
                                            {count > 0 && (
                                                <div className={`text-[10px] font-medium mt-0.5 ${today ? 'text-blue-500' : 'text-gray-400'}`}>
                                                    {count} case{count !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Day columns */}
                            <div className="grid grid-cols-7 flex-1 divide-x divide-gray-200">
                                {weekDays.map((day, i) => {
                                    const today = isToday(day);
                                    const dayCases = casesByDay[i];

                                    return (
                                        <div
                                            key={i}
                                            className={`
                                                flex flex-col gap-1.5 p-1.5 min-h-[400px] overflow-y-auto
                                                ${today ? 'bg-blue-50/30' : 'bg-white'}
                                            `}
                                        >
                                            {dayCases.length === 0 && (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="text-[10px] text-gray-300 select-none">—</span>
                                                </div>
                                            )}
                                            {dayCases.map((vetCase: VetCase) => (
                                                <CalendarCaseCard
                                                    key={vetCase.caseId.toString()}
                                                    vetCase={vetCase}
                                                    onTaskToggle={handleTaskToggle}
                                                    onCardClick={(caseId) => onNavigateToCaseDetail(caseId)}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty state — no cases at all */}
                {!isLoading && !error && cases.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto flex flex-col items-center text-center py-12">
                            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                                <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                                    <rect x="9" y="3" width="6" height="4" rx="1" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-600 mb-1">No cases yet</h3>
                            <p className="text-xs text-gray-400 mb-3">Create your first case to get started</p>
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
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
