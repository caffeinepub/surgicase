import React from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';

export default function LoginPage() {
    const { login, loginStatus } = useInternetIdentity();
    const isLoggingIn = loginStatus === 'logging-in';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg mb-4 bg-blue-600 flex items-center justify-center">
                        <img
                            src="/assets/generated/surgicase-logo.dim_512x512.png"
                            alt="SurgiCase"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SurgiCase</h1>
                    <p className="text-sm text-gray-500 mt-1">Veterinary Surgery Case Tracker</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">Welcome back</h2>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Sign in to access your surgery cases
                    </p>

                    <button
                        onClick={login}
                        disabled={isLoggingIn}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isLoggingIn ? (
                            <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                                Login with Internet Identity
                            </>
                        )}
                    </button>

                    <p className="text-xs text-gray-400 text-center mt-4">
                        Secured by Internet Identity on the Internet Computer
                    </p>
                </div>

                {/* Features */}
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                    {[
                        { icon: '🔒', label: 'Secure' },
                        { icon: '📱', label: 'Mobile Ready' },
                        { icon: '☁️', label: 'Cloud Stored' },
                    ].map((f) => (
                        <div key={f.label} className="bg-white/60 rounded-xl p-3 border border-gray-100">
                            <div className="text-xl mb-1">{f.icon}</div>
                            <div className="text-xs text-gray-500 font-medium">{f.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
