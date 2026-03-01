import React from 'react';
import type { TaskKey } from '../../types/case';

interface TaskConfig {
    label: string;
    color: string;
    completedBg: string;
    incompleteBg: string;
    completedText: string;
    incompleteText: string;
    icon: React.ReactNode;
}

const TASK_CONFIGS: Record<TaskKey, TaskConfig> = {
    dischargeNotes: {
        label: 'Discharge Notes',
        color: 'green',
        completedBg: 'bg-green-500',
        incompleteBg: 'bg-green-50 border border-green-200',
        completedText: 'text-white',
        incompleteText: 'text-green-400',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6M9 16h4" />
            </svg>
        ),
    },
    pDVMNotified: {
        label: 'pDVM Notified',
        color: 'yellow',
        completedBg: 'bg-yellow-400',
        incompleteBg: 'bg-yellow-50 border border-yellow-200',
        completedText: 'text-white',
        incompleteText: 'text-yellow-400',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
            </svg>
        ),
    },
    labs: {
        label: 'Labs',
        color: 'orange',
        completedBg: 'bg-orange-500',
        incompleteBg: 'bg-orange-50 border border-orange-200',
        completedText: 'text-white',
        incompleteText: 'text-orange-400',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M9 3h6v11l3.5 6H5.5L9 14V3z" />
                <path d="M6 14h12" />
            </svg>
        ),
    },
    histo: {
        label: 'Histo',
        color: 'purple',
        completedBg: 'bg-purple-600',
        incompleteBg: 'bg-purple-50 border border-purple-200',
        completedText: 'text-white',
        incompleteText: 'text-purple-400',
        icon: (
            // Microscope icon
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M6 18h8" />
                <path d="M3 21h18" />
                <path d="M14 21v-4" />
                <path d="M14 7v4" />
                <path d="M10 7V3" />
                <rect x="8" y="3" width="8" height="4" rx="1" />
                <path d="M14 11a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
            </svg>
        ),
    },
    surgeryReport: {
        label: 'Surgery Report',
        color: 'red',
        completedBg: 'bg-red-500',
        incompleteBg: 'bg-red-50 border border-red-200',
        completedText: 'text-white',
        incompleteText: 'text-red-400',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M12 5v14M5 12h14" />
            </svg>
        ),
    },
    imaging: {
        label: 'Imaging',
        color: 'blue',
        completedBg: 'bg-blue-500',
        incompleteBg: 'bg-blue-50 border border-blue-200',
        completedText: 'text-white',
        incompleteText: 'text-blue-400',
        icon: (
            // Bone icon
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M17 10c.7-.7 1.69-.7 2.5 0a1.77 1.77 0 0 1 0 2.5c-.7.7-.7 1.69 0 2.5a1.77 1.77 0 0 1-2.5 2.5c-.7-.7-1.69-.7-2.5 0a1.77 1.77 0 0 1-2.5-2.5c.7-.7.7-1.69 0-2.5a1.77 1.77 0 0 1 0-2.5c.7-.7 1.69-.7 2.5 0a1.77 1.77 0 0 1 2.5 0z" />
                <path d="M7 14c-.7.7-1.69.7-2.5 0a1.77 1.77 0 0 1 0-2.5c.7-.7.7-1.69 0-2.5a1.77 1.77 0 0 1 2.5-2.5c.7.7 1.69.7 2.5 0a1.77 1.77 0 0 1 2.5 2.5c-.7.7-.7 1.69 0 2.5a1.77 1.77 0 0 1 0 2.5c-.7.7-1.69.7-2.5 0a1.77 1.77 0 0 1-2.5 0z" />
            </svg>
        ),
    },
    culture: {
        label: 'Culture',
        color: 'pink',
        completedBg: 'bg-pink-500',
        incompleteBg: 'bg-pink-50 border border-pink-200',
        completedText: 'text-white',
        incompleteText: 'text-pink-400',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <ellipse cx="12" cy="12" rx="9" ry="5" />
                <ellipse cx="12" cy="12" rx="5" ry="2.5" />
                <line x1="12" y1="7" x2="12" y2="17" />
            </svg>
        ),
    },
    dailySummary: {
        label: 'Daily Summary',
        color: 'teal',
        completedBg: 'bg-teal-500',
        incompleteBg: 'bg-teal-50 border border-teal-200',
        completedText: 'text-white',
        incompleteText: 'text-teal-400',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
            </svg>
        ),
    },
};

interface TaskBadgeProps {
    taskKey: TaskKey;
    completed: boolean;
    onClick?: () => void;
    showLabel?: boolean;
    /** When true, renders icon only (no label text, smaller container) */
    iconOnly?: boolean;
}

export default function TaskBadge({ taskKey, completed, onClick, showLabel = false, iconOnly = false }: TaskBadgeProps) {
    const config = TASK_CONFIGS[taskKey];

    if (iconOnly) {
        return (
            <button
                type="button"
                onClick={onClick}
                disabled={!onClick}
                title={config.label}
                className={`
                    w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150
                    ${completed
                        ? config.completedBg + ' ' + config.completedText
                        : config.incompleteBg + ' ' + config.incompleteText
                    }
                    ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
                `}
            >
                <span className="w-3 h-3 flex items-center justify-center [&>svg]:w-3 [&>svg]:h-3">
                    {config.icon}
                </span>
            </button>
        );
    }

    return (
        <div className="flex flex-col items-center gap-0.5">
            <button
                type="button"
                onClick={onClick}
                disabled={!onClick}
                title={config.label}
                className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150
                    ${completed ? config.completedBg + ' ' + config.completedText : config.incompleteBg + ' ' + config.incompleteText}
                    ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
                    ${!completed ? 'opacity-60' : ''}
                `}
            >
                {config.icon}
            </button>
            {showLabel && (
                <span className={`text-xs font-medium ${completed ? 'text-gray-700' : 'text-gray-400'}`}>
                    {config.label}
                </span>
            )}
        </div>
    );
}
