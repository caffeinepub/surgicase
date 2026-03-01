import React from 'react';

export type FilterOption = 'all' | 'complete' | 'histo' | 'imaging' | 'labs' | 'culture';
export type SortOption = 'oldest' | 'newest';

interface FilterBarProps {
    filter: FilterOption;
    sort: SortOption;
    search: string;
    onFilterChange: (f: FilterOption) => void;
    onSortChange: (s: SortOption) => void;
    onSearchChange: (s: string) => void;
}

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All Cases' },
    { value: 'complete', label: 'All Complete' },
    { value: 'histo', label: 'Histo' },
    { value: 'imaging', label: 'Imaging' },
    { value: 'labs', label: 'Labs' },
    { value: 'culture', label: 'Culture' },
];

export default function FilterBar({
    filter,
    sort,
    search,
    onFilterChange,
    onSortChange,
    onSearchChange,
}: FilterBarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0 w-full sm:w-auto sm:max-w-xs">
                <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search cases..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1">
                {FILTER_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onFilterChange(opt.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            filter === opt.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Sort toggle */}
            <button
                onClick={() => onSortChange(sort === 'oldest' ? 'newest' : 'oldest')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 whitespace-nowrap"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M7 12h10M11 18h2" />
                </svg>
                {sort === 'oldest' ? 'Oldest First' : 'Newest First'}
            </button>
        </div>
    );
}
