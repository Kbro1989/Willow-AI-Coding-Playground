import React from 'react';
import { collaborativeSync } from '../../services/gameData/collaborativeSyncService';
import { db } from '../../lib/db';

interface CursorTrackerProps {
    currentUserId: string | null;
}

/**
 * CursorTracker Component
 * Renders cursors of all other users in real-time
 */
export const CursorTracker: React.FC<CursorTrackerProps> = ({ currentUserId }) => {
    // 1. Ingest presence data from InstantDB
    const { data, isLoading } = db.useQuery({ presence: {} });

    if (isLoading || !data?.presence) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {data.presence
                .filter(p => p.userId !== currentUserId) // Filter out self
                .map(presence => (
                    <div
                        key={presence.userId}
                        className="absolute transition-transform duration-75 ease-out"
                        style={{
                            transform: `translate(${presence.cursorX}px, ${presence.cursorY}px)`,
                        }}
                    >
                        {/* Cursor Dot */}
                        <div className="relative">
                            <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />

                            {/* User Label */}
                            <div className="absolute left-4 top-0 whitespace-nowrap bg-black/80 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] text-cyan-300 font-mono backdrop-blur-sm">
                                {presence.userName || 'Anonymous Agent'}
                                {presence.activeTab && (
                                    <span className="ml-2 text-cyan-500/50 italic">
                                        @{presence.activeTab}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
        </div>
    );
};

export default CursorTracker;
