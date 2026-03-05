import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

interface HeaderProps {
  currentPage: "dashboard" | "cases";
  onNavigate: (page: "dashboard" | "cases") => void;
  userName?: string;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
}

export default function Header({
  currentPage,
  onNavigate,
  userName,
  onExportCSV,
  onExportPDF,
}: HeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src="/assets/uploads/Vet-app-icon-with-dog-and-cat-4.png"
                  alt="SurgiTrack"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <span className="font-bold text-gray-900 text-base tracking-tight">
                SurgiTrack
              </span>
            </div>

            <nav className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => onNavigate("dashboard")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === "dashboard"
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Calendar
              </button>
              <button
                type="button"
                onClick={() => onNavigate("cases")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === "cases"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Cases
              </button>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onExportCSV && (
              <button
                type="button"
                onClick={onExportCSV}
                className="hidden sm:flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                title="Export CSV"
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
                CSV
              </button>
            )}

            {onExportPDF && (
              <button
                type="button"
                onClick={onExportPDF}
                className="hidden sm:flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                title="Export PDF"
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
                PDF
              </button>
            )}

            {identity && (
              <div className="flex items-center gap-2 ml-1">
                {userName && (
                  <span className="hidden md:block text-xs text-gray-500 font-medium">
                    {userName}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                  title="Logout"
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
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex border-t border-gray-100 -mx-4 px-4 py-1.5 gap-2">
          <button
            type="button"
            onClick={() => onNavigate("dashboard")}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
              currentPage === "dashboard"
                ? "bg-teal-50 text-teal-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => onNavigate("cases")}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
              currentPage === "cases"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Cases
          </button>
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="flex-1 py-1 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              CSV
            </button>
          )}
          {onExportPDF && (
            <button
              type="button"
              onClick={onExportPDF}
              className="flex-1 py-1 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              PDF
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
