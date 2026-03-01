import React, { useState } from 'react';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';

interface Props {
    onComplete: () => void;
}

export default function ProfileSetupModal({ onComplete }: Props) {
    const [name, setName] = useState('');
    const saveProfile = useSaveCallerUserProfile();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        await saveProfile.mutateAsync({ name: name.trim() });
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-sm animate-fade-in">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Set Up Your Profile</h2>
                    <p className="text-sm text-gray-500 mt-1">Enter your name to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Dr. Smith"
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!name.trim() || saveProfile.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saveProfile.isPending ? 'Saving...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
