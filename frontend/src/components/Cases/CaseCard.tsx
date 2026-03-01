import React, { useState, useCallback } from 'react';
import type { VetCase, TaskKey, Species, Sex, TaskStatus } from '../../types/case';
import { ALL_TASK_KEYS, areAllTasksComplete } from '../../types/case';
import { calculateAge } from '../../utils/dateUtils';
import TaskBadge from './TaskBadge';
import DateInput from '../shared/DateInput';

const SPECIES_LABELS: Record<Species, string> = {
    canine: 'Canine',
    feline: 'Feline',
    other: 'Other',
};

const SEX_LABELS: Record<Sex, string> = {
    male: 'Male',
    maleNeutered: 'Male Neutered',
    female: 'Female',
    femaleSpayed: 'Female Spayed',
};

interface SpeciesBadgeProps {
    species: Species;
}

function SpeciesBadge({ species }: SpeciesBadgeProps) {
    const iconSrc =
        species === 'canine'
            ? '/assets/generated/species-dog.dim_64x64.png'
            : species === 'feline'
            ? '/assets/generated/species-cat.dim_64x64.png'
            : '/assets/generated/species-paw.dim_64x64.png';

    const colors: Record<Species, string> = {
        canine: 'bg-amber-50 text-amber-700 border-amber-200',
        feline: 'bg-violet-50 text-violet-700 border-violet-200',
        other: 'bg-gray-50 text-gray-700 border-gray-200',
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[species]}`}>
            <img
                src={iconSrc}
                alt={species}
                className="w-3.5 h-3.5 object-contain"
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                }}
            />
            {SPECIES_LABELS[species]}
        </span>
    );
}

interface CaseCardProps {
    vetCase: VetCase;
    editable?: boolean;
    onUpdate?: (updated: VetCase) => void;
    onDelete?: () => void;
    onClick?: () => void;
}

export default function CaseCard({ vetCase, editable = false, onUpdate, onDelete, onClick }: CaseCardProps) {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [localCase, setLocalCase] = useState<VetCase>(vetCase);

    // Sync when parent updates
    React.useEffect(() => {
        setLocalCase(vetCase);
    }, [vetCase]);

    const allComplete = areAllTasksComplete(localCase.tasks);

    const handleFieldChange = useCallback(
        (field: keyof VetCase, value: string) => {
            const updated = { ...localCase, [field]: value };
            setLocalCase(updated);
            onUpdate?.(updated);
        },
        [localCase, onUpdate]
    );

    const handleTaskToggle = useCallback(
        (taskKey: TaskKey) => {
            if (!editable) return;
            const updated: VetCase = {
                ...localCase,
                tasks: { ...localCase.tasks, [taskKey]: !localCase.tasks[taskKey] },
            };
            setLocalCase(updated);
            onUpdate?.(updated);
        },
        [localCase, editable, onUpdate]
    );

    const handleBlur = () => setEditingField(null);

    const EditableText = ({
        field,
        value,
        className = '',
        placeholder = '',
        multiline = false,
    }: {
        field: keyof VetCase;
        value: string;
        className?: string;
        placeholder?: string;
        multiline?: boolean;
    }) => {
        if (!editable) {
            return <span className={className}>{value || <span className="text-gray-400 italic">{placeholder}</span>}</span>;
        }

        if (editingField === field) {
            if (multiline) {
                return (
                    <textarea
                        autoFocus
                        value={value}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        onBlur={handleBlur}
                        className="w-full text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none"
                        rows={2}
                        placeholder={placeholder}
                    />
                );
            }
            return (
                <input
                    autoFocus
                    type="text"
                    value={value}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    onBlur={handleBlur}
                    className={`inline-edit-input ${className}`}
                    placeholder={placeholder}
                />
            );
        }

        return (
            <span
                className={`${className} cursor-pointer hover:bg-blue-50 rounded px-0.5 -mx-0.5 transition-colors`}
                onClick={() => setEditingField(field)}
                title="Click to edit"
            >
                {value || <span className="text-gray-400 italic text-xs">{placeholder || 'Click to edit'}</span>}
            </span>
        );
    };

    const SelectField = ({
        field,
        value,
        options,
        className = '',
    }: {
        field: keyof VetCase;
        value: string;
        options: { value: string; label: string }[];
        className?: string;
    }) => {
        if (!editable) {
            return <span className={className}>{options.find((o) => o.value === value)?.label || value}</span>;
        }
        return (
            <select
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className={`text-sm border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${className}`}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        );
    };

    const cardContent = (
        <div
            className={`surgi-card p-4 transition-all duration-200 ${
                allComplete ? 'opacity-50' : ''
            } ${onClick ? 'cursor-pointer hover:shadow-card-hover hover:border-blue-200' : ''}`}
            onClick={!editable ? onClick : undefined}
        >
            {/* Top row: Arrival Date + Pet Name */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {editable ? (
                            <DateInput
                                value={localCase.arrivalDate}
                                onChange={(v) => handleFieldChange('arrivalDate', v)}
                                className="text-xs"
                            />
                        ) : (
                            <span className="text-xs text-gray-500 font-medium">{localCase.arrivalDate}</span>
                        )}
                    </div>
                    <span className="text-gray-300">·</span>
                    <span className="text-base font-bold text-gray-900">
                        <EditableText field="petName" value={localCase.petName} placeholder="Pet Name" className="text-base font-bold text-gray-900" />
                    </span>
                </div>

                {editable && onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 p-0.5"
                        title="Delete case"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                        </svg>
                    </button>
                )}
            </div>

            {/* MRN - large font */}
            <div className="mb-2">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">MRN </span>
                <span className="text-xl font-bold text-blue-700 tracking-tight">
                    <EditableText field="mrn" value={localCase.mrn} placeholder="MRN" className="text-xl font-bold text-blue-700" />
                </span>
            </div>

            {/* Species + Sex + Breed row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
                {editable ? (
                    <SelectField
                        field="species"
                        value={localCase.species}
                        options={[
                            { value: 'canine', label: 'Canine' },
                            { value: 'feline', label: 'Feline' },
                            { value: 'other', label: 'Other' },
                        ]}
                    />
                ) : (
                    <SpeciesBadge species={localCase.species} />
                )}
                <span className="text-xs text-gray-500">
                    {editable ? (
                        <SelectField
                            field="sex"
                            value={localCase.sex}
                            options={[
                                { value: 'male', label: 'Male' },
                                { value: 'maleNeutered', label: 'Male Neutered' },
                                { value: 'female', label: 'Female' },
                                { value: 'femaleSpayed', label: 'Female Spayed' },
                            ]}
                        />
                    ) : (
                        SEX_LABELS[localCase.sex]
                    )}
                </span>
                <span className="text-xs text-gray-600">
                    <EditableText field="breed" value={localCase.breed} placeholder="Breed" className="text-xs text-gray-600" />
                </span>
            </div>

            {/* Owner + DOB + Age */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-gray-600">
                <span>
                    <span className="text-gray-400">Owner: </span>
                    <EditableText field="ownerLastName" value={localCase.ownerLastName} placeholder="Last Name" className="text-xs text-gray-700 font-medium" />
                </span>
                <span>
                    <span className="text-gray-400">DOB: </span>
                    {editable ? (
                        <DateInput
                            value={localCase.dateOfBirth}
                            onChange={(v) => handleFieldChange('dateOfBirth', v)}
                            className="inline-flex"
                        />
                    ) : (
                        <span className="text-gray-700">{localCase.dateOfBirth}</span>
                    )}
                </span>
                {localCase.dateOfBirth && (
                    <span>
                        <span className="text-gray-400">Age: </span>
                        <span className="text-gray-700 font-medium">{calculateAge(localCase.dateOfBirth)}</span>
                    </span>
                )}
            </div>

            {/* Presenting Complaint */}
            <div className="complaint-box mb-2">
                <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide block mb-0.5">Presenting Complaint</span>
                {editable ? (
                    <textarea
                        value={localCase.presentingComplaint}
                        onChange={(e) => handleFieldChange('presentingComplaint', e.target.value)}
                        className="w-full text-sm bg-transparent border-none outline-none resize-none text-orange-900 placeholder-orange-300"
                        rows={2}
                        placeholder="Enter presenting complaint..."
                    />
                ) : (
                    <p className="text-sm text-orange-900">{localCase.presentingComplaint || <span className="italic text-orange-300">None recorded</span>}</p>
                )}
            </div>

            {/* Notes (only if non-empty or editable) */}
            {(localCase.notes || editable) && (
                <div className="notes-box mb-3">
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide block mb-0.5">Notes</span>
                    {editable ? (
                        <textarea
                            value={localCase.notes}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                            className="w-full text-sm bg-transparent border-none outline-none resize-none text-green-900 placeholder-green-300"
                            rows={2}
                            placeholder="Additional notes..."
                        />
                    ) : (
                        <p className="text-sm text-green-900">{localCase.notes}</p>
                    )}
                </div>
            )}

            {/* Task Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100">
                {ALL_TASK_KEYS.map((key) => (
                    <TaskBadge
                        key={key}
                        taskKey={key}
                        completed={localCase.tasks[key]}
                        onClick={editable ? () => handleTaskToggle(key) : undefined}
                        showLabel={true}
                    />
                ))}
            </div>

            {allComplete && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                    All tasks complete
                </div>
            )}
        </div>
    );

    return cardContent;
}
