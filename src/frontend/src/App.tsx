import React, { useState, useRef } from "react";
import LoginPage from "./components/Auth/LoginPage";
import ProfileSetupModal from "./components/Auth/ProfileSetupModal";
import CasesPage from "./components/Cases/CasesPage";
import DashboardPage from "./components/Dashboard/DashboardPage";
import Header from "./components/Layout/Header";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";

type Page = "dashboard" | "cases";

// Wrap the target case in an object with a unique key so that navigating
// to the same case twice in a row still triggers the useEffect in CasesPage.
export interface TargetCase {
  caseId: bigint;
  key: number; // monotonically increasing, forces re-trigger
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [targetCase, setTargetCase] = useState<TargetCase | null>(null);
  const navKeyRef = useRef(0);

  const handleNavigateToCaseDetail = (caseId: bigint) => {
    // Guard: 0n means "no linked case"
    if (!caseId || caseId === 0n) return;

    navKeyRef.current += 1;
    setTargetCase({ caseId, key: navKeyRef.current });
    setCurrentPage("cases");
  };

  const handleClearTargetCase = () => {
    setTargetCase(null);
  };

  // Show loading spinner while initializing auth
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin w-8 h-8 text-teal-600"
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
          <span className="text-sm text-gray-500">Loading SurgiCase...</span>
        </div>
      </div>
    );
  }

  // Not authenticated → show login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated but profile not yet loaded → wait
  if (profileLoading && !profileFetched) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin w-8 h-8 text-teal-600"
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
          <span className="text-sm text-gray-500">Loading profile...</span>
        </div>
      </div>
    );
  }

  // Authenticated but no profile → show setup modal
  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showProfileSetup && <ProfileSetupModal onComplete={() => {}} />}

      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        userName={userProfile?.name}
      />

      <main className="flex-1">
        {currentPage === "dashboard" ? (
          <DashboardPage onNavigateToCaseDetail={handleNavigateToCaseDetail} />
        ) : (
          <CasesPage
            targetCase={targetCase}
            onTargetCaseHandled={handleClearTargetCase}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-3 px-4 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} SurgiCase · Built with{" "}
          <span className="text-red-400">♥</span> using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || "surgicase")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
