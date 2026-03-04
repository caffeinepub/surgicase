import type React from "react";
import type { TaskKey } from "../../types/case";

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
    label: "Discharge Notes",
    color: "green",
    completedBg: "bg-green-500",
    incompleteBg: "bg-green-50 border border-green-200",
    completedText: "text-white",
    incompleteText: "text-green-400",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-full h-full"
        aria-hidden="true"
        role="presentation"
      >
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  pDVMNotified: {
    label: "pDVM Notified",
    color: "yellow",
    completedBg: "bg-yellow-400",
    incompleteBg: "bg-yellow-50 border border-yellow-200",
    completedText: "text-white",
    incompleteText: "text-yellow-400",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-full h-full"
        aria-hidden="true"
        role="presentation"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  labs: {
    label: "Labs",
    color: "orange",
    completedBg: "bg-orange-500",
    incompleteBg: "bg-orange-50 border border-orange-200",
    completedText: "text-white",
    incompleteText: "text-orange-400",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-full h-full"
        aria-hidden="true"
        role="presentation"
      >
        <path d="M9 3h6v11l3.5 6H5.5L9 14V3z" />
        <path d="M6 14h12" />
      </svg>
    ),
  },
  histo: {
    label: "Histo",
    color: "purple",
    completedBg: "bg-purple-600",
    incompleteBg: "bg-purple-50 border border-purple-200",
    completedText: "text-white",
    incompleteText: "text-purple-400",
    icon: (
      // Microscope icon
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-full h-full"
        aria-hidden="true"
        role="presentation"
      >
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
    label: "Surgery Report",
    color: "red",
    completedBg: "bg-red-500",
    incompleteBg: "bg-red-50 border border-red-200",
    completedText: "text-white",
    incompleteText: "text-red-500",
    icon: (
      // Red scissors icon
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
        aria-hidden="true"
        role="presentation"
      >
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </svg>
    ),
  },
  imaging: {
    label: "Imaging",
    color: "blue",
    completedBg: "bg-blue-500",
    incompleteBg: "bg-blue-50 border border-blue-200",
    completedText: "text-white",
    incompleteText: "text-blue-400",
    icon: (
      // Femur bone — angled shaft with rounded head (top-left) and condyle (bottom-right)
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-full h-full"
        aria-hidden="true"
        role="presentation"
      >
        {/* Femoral head — large ball at top-left */}
        <circle cx="6.5" cy="5.5" r="3" />
        {/* Greater trochanter bump at top */}
        <circle cx="10" cy="4" r="1.8" />
        {/* Diagonal shaft */}
        <rect
          x="9.5"
          y="7.5"
          width="4.5"
          height="11"
          rx="2.2"
          transform="rotate(35 11.75 13)"
        />
        {/* Medial condyle — lower-right */}
        <circle cx="17.5" cy="19" r="2.5" />
        {/* Lateral condyle bump */}
        <circle cx="14.5" cy="20.5" r="1.8" />
      </svg>
    ),
  },
  culture: {
    label: "Culture",
    color: "pink",
    completedBg: "bg-pink-500",
    incompleteBg: "bg-pink-50 border border-pink-200",
    completedText: "text-white",
    incompleteText: "text-pink-400",
    icon: (
      // Rod-shaped bacteria (bacilli) — two rods with flagella
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
        aria-hidden="true"
        role="presentation"
      >
        {/* Rod 1: vertical, left side */}
        <rect x="5" y="6" width="4" height="10" rx="2" />
        {/* Flagella on rod 1 */}
        <line x1="7" y1="6" x2="5" y2="3" />
        <line x1="7" y1="16" x2="9" y2="19" />
        <line x1="5" y1="10" x2="2" y2="9" />
        {/* Rod 2: angled, right side */}
        <rect
          x="14"
          y="7"
          width="4"
          height="10"
          rx="2"
          transform="rotate(-20 16 12)"
        />
        {/* Flagella on rod 2 */}
        <line x1="17" y1="8" x2="20" y2="5" />
        <line x1="15" y1="17" x2="13" y2="20" />
        <line x1="18" y1="13" x2="22" y2="14" />
      </svg>
    ),
  },
  dailySummary: {
    label: "Daily Summary",
    color: "teal",
    completedBg: "bg-teal-500",
    incompleteBg: "bg-teal-50 border border-teal-200",
    completedText: "text-white",
    incompleteText: "text-teal-400",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-full h-full"
        aria-hidden="true"
        role="presentation"
      >
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

export default function TaskBadge({
  taskKey,
  completed,
  onClick,
  showLabel = false,
  iconOnly = false,
}: TaskBadgeProps) {
  const config = TASK_CONFIGS[taskKey];

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        title={config.label}
        className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150
                    ${
                      completed
                        ? `${config.completedBg} ${config.completedText}`
                        : `${config.incompleteBg} ${config.incompleteText}`
                    }
                    ${onClick ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default"}
                `}
      >
        <span className="w-5 h-5 flex items-center justify-center">
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
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150
                    ${completed ? `${config.completedBg} ${config.completedText}` : `${config.incompleteBg} ${config.incompleteText}`}
                    ${onClick ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default"}
                    ${!completed ? "opacity-60" : ""}
                `}
      >
        <span className="w-6 h-6 flex items-center justify-center">
          {config.icon}
        </span>
      </button>
      {showLabel && (
        <span
          className={`text-xs font-medium ${completed ? "text-gray-700" : "text-gray-400"}`}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}
