import type { TaskKey } from "../../types/case";

interface TaskConfig {
  label: string;
  color: string;
  completedBg: string;
  incompleteBg: string;
  completedText: string;
  incompleteText: string;
  imgSrc: string;
}

const TASK_CONFIGS: Record<TaskKey, TaskConfig> = {
  dischargeNotes: {
    label: "Discharge Notes",
    color: "green",
    completedBg: "bg-green-500",
    incompleteBg: "bg-green-50 border border-green-200",
    completedText: "text-white",
    incompleteText: "text-green-400",
    imgSrc: "/assets/uploads/clipboard-5.png",
  },
  pDVMNotified: {
    label: "pDVM Notified",
    color: "yellow",
    completedBg: "bg-yellow-400",
    incompleteBg: "bg-yellow-50 border border-yellow-200",
    completedText: "text-white",
    incompleteText: "text-yellow-400",
    imgSrc: "/assets/uploads/envelope-4.png",
  },
  labs: {
    label: "Labs",
    color: "orange",
    completedBg: "bg-orange-500",
    incompleteBg: "bg-orange-50 border border-orange-200",
    completedText: "text-white",
    incompleteText: "text-orange-400",
    imgSrc: "/assets/uploads/lab-flask-2.png",
  },
  histo: {
    label: "Histo",
    color: "purple",
    completedBg: "bg-purple-600",
    incompleteBg: "bg-purple-50 border border-purple-200",
    completedText: "text-white",
    incompleteText: "text-purple-400",
    imgSrc: "/assets/uploads/microscope-1.png",
  },
  surgeryReport: {
    label: "Surgery Report",
    color: "red",
    completedBg: "bg-red-500",
    incompleteBg: "bg-red-50 border border-red-200",
    completedText: "text-white",
    incompleteText: "text-red-500",
    imgSrc: "/assets/uploads/scissors-3.png",
  },
  imaging: {
    label: "Imaging",
    color: "blue",
    completedBg: "bg-blue-500",
    incompleteBg: "bg-blue-50 border border-blue-200",
    completedText: "text-white",
    incompleteText: "text-blue-400",
    imgSrc: "/assets/uploads/bone-8.png",
  },
  culture: {
    label: "Culture",
    color: "pink",
    completedBg: "bg-pink-500",
    incompleteBg: "bg-pink-50 border border-pink-200",
    completedText: "text-white",
    incompleteText: "text-pink-400",
    imgSrc: "/assets/uploads/bacteria-7.png",
  },
  dailySummary: {
    label: "Daily Summary",
    color: "teal",
    completedBg: "bg-teal-500",
    incompleteBg: "bg-teal-50 border border-teal-200",
    completedText: "text-white",
    incompleteText: "text-teal-400",
    imgSrc: "/assets/uploads/circular-arrow-6.png",
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

  // Incomplete = prominent/colored (needs attention)
  // Complete = soft green with checkmark overlay (done)
  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        title={
          completed
            ? `${config.label} (done)`
            : `${config.label} (needs to be done)`
        }
        className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 relative
                    ${
                      completed
                        ? "bg-green-100 border border-green-300"
                        : `${config.completedBg} ${config.completedText}`
                    }
                    ${onClick ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default"}
                `}
      >
        {completed ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="w-4 h-4 text-green-600"
            aria-hidden="true"
            role="presentation"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <span className="w-5 h-5 flex items-center justify-center">
            <img
              src={config.imgSrc}
              alt={config.label}
              className="w-full h-full object-contain"
            />
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        title={
          completed
            ? `${config.label} (done)`
            : `${config.label} (needs to be done)`
        }
        className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 relative
                    ${
                      completed
                        ? "bg-green-100 border border-green-300"
                        : `${config.completedBg} ${config.completedText}`
                    }
                    ${onClick ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default"}
                `}
      >
        {completed ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="w-5 h-5 text-green-600"
            aria-hidden="true"
            role="presentation"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <span className="w-6 h-6 flex items-center justify-center">
            <img
              src={config.imgSrc}
              alt={config.label}
              className="w-full h-full object-contain"
            />
          </span>
        )}
      </button>
      {showLabel && (
        <span
          className={`text-xs font-medium ${completed ? "text-green-600" : "text-gray-600"}`}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}
