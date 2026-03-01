import React from 'react';
import type { VetCase, TaskKey } from '../../types/case';
import { ALL_TASK_KEYS, areAllTasksComplete } from '../../types/case';
import TaskBadge from '../Cases/TaskBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CalendarCaseCardProps {
    vetCase: VetCase;
    onTaskToggle: (caseId: bigint, taskName: string, currentValue: boolean) => void;
    onCardClick?: (caseId: bigint) => void;
}

function formatSpecies(species: string): string {
    switch (species) {
        case 'canine': return 'K9';
        case 'feline': return 'Fel';
        default: return 'Other';
    }
}

function formatSex(sex: string): string {
    switch (sex) {
        case 'male': return 'M';
        case 'maleNeutered': return 'MN';
        case 'female': return 'F';
        case 'femaleSpayed': return 'FS';
        default: return sex;
    }
}

function taskLabel(taskKey: TaskKey): string {
    switch (taskKey) {
        case 'pDVMNotified': return 'pDVM Notified';
        case 'dischargeNotes': return 'Discharge Notes';
        case 'surgeryReport': return 'Surgery Report';
        case 'dailySummary': return 'Daily Summary';
        default: return taskKey.charAt(0).toUpperCase() + taskKey.slice(1);
    }
}

export default function CalendarCaseCard({ vetCase, onTaskToggle, onCardClick }: CalendarCaseCardProps) {
    const allComplete = areAllTasksComplete(vetCase.tasks);

    const handleCardClick = (e: React.MouseEvent) => {
        // Only navigate if the click wasn't on a task badge button
        if ((e.target as HTMLElement).closest('button')) return;
        onCardClick?.(vetCase.caseId);
    };

    return (
        <div
            className={`
                rounded-lg border bg-white p-1.5 text-xs shadow-sm
                transition-all duration-150
                ${allComplete ? 'opacity-60 border-gray-200' : 'border-blue-100'}
                ${onCardClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5' : ''}
            `}
            onClick={handleCardClick}
            title={onCardClick ? 'Click to view on Cases page' : undefined}
        >
            {/* Pet name + MRN */}
            <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-gray-900 truncate">{vetCase.petName || '—'}</span>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                    {vetCase.mrn}
                </span>
            </div>

            {/* Species / Sex / Owner */}
            <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
                <span className="font-medium">{formatSpecies(vetCase.species)}</span>
                <span className="text-gray-300">·</span>
                <span>{formatSex(vetCase.sex)}</span>
                {vetCase.ownerLastName && (
                    <>
                        <span className="text-gray-300">·</span>
                        <span className="truncate font-medium text-gray-600">{vetCase.ownerLastName}</span>
                    </>
                )}
            </div>

            {/* Presenting complaint */}
            {vetCase.presentingComplaint && (
                <div className="text-[10px] text-gray-500 mb-1.5 truncate italic leading-tight">
                    {vetCase.presentingComplaint}
                </div>
            )}

            {/* Task badges — icon only */}
            <div className="flex flex-wrap gap-1">
                {ALL_TASK_KEYS.map((key) => (
                    <Tooltip key={key}>
                        <TooltipTrigger asChild>
                            {/* stopPropagation on the wrapper so card click doesn't fire */}
                            <span onClick={(e) => e.stopPropagation()}>
                                <TaskBadge
                                    taskKey={key}
                                    completed={vetCase.tasks[key]}
                                    onClick={() => onTaskToggle(vetCase.caseId, key, vetCase.tasks[key])}
                                    iconOnly={true}
                                />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            {taskLabel(key)}: {vetCase.tasks[key] ? 'Complete' : 'Pending'}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
}
