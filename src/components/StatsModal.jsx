import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Star } from "lucide-react";

export default function StatsModal({ open, onClose, history, activeUser, avatarProfiles = {} }) {
    // Calculate stats
    const stats = history.reduce((acc, item) => {
        const name = item.poppedBy || "Anonymous";
        if (!acc[name]) {
            acc[name] = { count: 0, score: 0 };
        }
        acc[name].count += 1;
        acc[name].score += (item.score || 5);
        return acc;
    }, {});

    const leaderboardNames = Array.from(
        new Set([...Object.keys(avatarProfiles), ...Object.keys(stats)])
    );

    const leaderboardRows = leaderboardNames
        .map((name) => {
            const data = stats[name] || { count: 0, score: 0 };
            return {
                name,
                count: data.count,
                historyScore: data.score,
                displayStars: avatarProfiles[name]?.stars ?? 0
            };
        })
        .sort((a, b) => {
            if (b.displayStars !== a.displayStars) return b.displayStars - a.displayStars;
            if (b.count !== a.count) return b.count - a.count;
            return b.historyScore - a.historyScore;
        });

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="backdrop"
                    role="presentation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="stats-leaderboard-title"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2 text-slate-800">
                                <Trophy className="text-yellow-500" size={24} />
                                <h2 id="stats-leaderboard-title" className="text-xl font-bold">Leaderboard</h2>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                                aria-label="Close stats"
                            >
                                <X size={20} aria-hidden />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto min-h-[300px]">
                            {leaderboardRows.length === 0 ? (
                                <div className="text-center text-slate-400 py-8">
                                    No bubbles popped yet!
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {leaderboardRows.map((user, index) => {
                                        const isSelected = activeUser === user.name;
                                        return (
                                            <div
                                                key={user.name}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected
                                                        ? 'bg-slate-800 border-slate-700'
                                                        : 'bg-slate-50 border-slate-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                            ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                            index === 1 ? 'bg-slate-200 text-slate-700' :
                                                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}
                          `}>
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className={`font-medium ${isSelected ? 'text-white' : 'text-slate-700'}`}>{user.name}</div>
                                                        <div className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{user.count} tasks</div>
                                                    </div>
                                                </div>
                                                <div className={`flex items-center gap-1 font-bold px-2 py-1 rounded-lg border shadow-sm ${isSelected
                                                        ? 'bg-white/10 border-white/20 text-white'
                                                        : 'bg-white border-slate-100 text-slate-900'
                                                    }`}>
                                                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                                    {user.displayStars}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
                            Total popped: {history.length}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
