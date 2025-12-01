import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Gift, PartyPopper, Plus, Trash2, Trophy } from "lucide-react";

export default function RewardsModal({ open, onClose, history, selectedUsers, prizes = [], onUpdatePrizes }) {
    const [prizeRevealed, setPrizeRevealed] = useState(null);
    const [isAddingPrize, setIsAddingPrize] = useState(false);
    const [newPrize, setNewPrize] = useState("");

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

    const sortedStats = Object.entries(stats)
        .sort((a, b) => b[1].score - a[1].score)
        .map(([name, data]) => ({ name, ...data }));

    const leader = sortedStats[0];
    const isLeader = leader && selectedUsers.length > 0 && selectedUsers.includes(leader.name);

    const handleClaimPrize = () => {
        if (prizes.length === 0) return;
        const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
        setPrizeRevealed(randomPrize);
    };

    const handleAddPrize = (e) => {
        e.preventDefault();
        const prize = newPrize.trim();
        if (prize && !prizes.includes(prize)) {
            onUpdatePrizes([...prizes, prize]);
            setNewPrize("");
            setIsAddingPrize(false);
        }
    };

    const handleRemovePrize = (prizeToRemove) => {
        onUpdatePrizes(prizes.filter(p => p !== prizeToRemove));
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
                            <div className="flex items-center gap-2">
                                <Gift className="text-purple-600" size={24} />
                                <h2 className="text-xl font-bold text-slate-800">Rewards</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {/* Prize Pool Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Prize Pool</h3>
                                    <button
                                        onClick={() => setIsAddingPrize(!isAddingPrize)}
                                        className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium transition-colors"
                                    >
                                        <Plus size={12} />
                                        Add Prize
                                    </button>
                                </div>

                                {isAddingPrize && (
                                    <form onSubmit={handleAddPrize} className="mb-3 flex gap-2">
                                        <input
                                            autoFocus
                                            value={newPrize}
                                            onChange={(e) => setNewPrize(e.target.value)}
                                            placeholder="e.g., Dinner out, Take care of kids..."
                                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newPrize.trim()}
                                            className="px-3 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </form>
                                )}

                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {prizes.length === 0 ? (
                                        <div className="text-center text-slate-400 text-sm py-4">
                                            No prizes yet. Add some!
                                        </div>
                                    ) : (
                                        prizes.map((prize, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 group">
                                                <span className="text-sm text-slate-700">{prize}</span>
                                                <button
                                                    onClick={() => handleRemovePrize(prize)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Claim Prize Section */}
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4 text-purple-600">
                                    <Gift size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Weekly Prize</h3>
                                <p className="text-slate-500 mb-6 max-w-[240px]">
                                    The person with the highest score gets to claim a special reward!
                                </p>

                                {leader ? (
                                    <div className="w-full bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100 mb-6">
                                        <div className="text-xs text-yellow-700 uppercase tracking-wider font-semibold mb-1">Current Leader</div>
                                        <div className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
                                            <Trophy size={18} className="text-yellow-500" />
                                            {leader.name}
                                        </div>
                                        <div className="text-sm text-slate-600 mt-1 flex items-center justify-center gap-1">
                                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                            {leader.score} points
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-slate-400 mb-6">No leader yet!</div>
                                )}

                                {isLeader ? (
                                    !prizeRevealed ? (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleClaimPrize}
                                            disabled={prizes.length === 0}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <PartyPopper size={20} />
                                            Claim Prize
                                        </motion.button>
                                    ) : (
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-6 rounded-2xl shadow-xl"
                                        >
                                            <div className="text-sm text-purple-600 font-bold uppercase mb-2">🎉 You won</div>
                                            <div className="text-2xl font-black text-slate-800">{prizeRevealed}</div>
                                        </motion.div>
                                    )
                                ) : (
                                    <div className="text-sm text-slate-400 bg-slate-50 px-4 py-2 rounded-lg">
                                        {selectedUsers.length === 0 ? "Select a user to see if you're the leader!" : "Only the leader can claim the prize. Keep popping!"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
