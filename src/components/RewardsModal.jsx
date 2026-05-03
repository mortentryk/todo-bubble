import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Gift, PartyPopper, Plus, Trash2 } from "lucide-react";

export default function RewardsModal({
    open,
    onClose,
    activeUser,
    prizes = [],
    onUpdatePrizes,
    starBalance = 0,
    unlockStars = 50,
    onClaimPrize
}) {
    const [prizeRevealed, setPrizeRevealed] = useState(null);
    const [isAddingPrize, setIsAddingPrize] = useState(false);
    const [newPrize, setNewPrize] = useState("");

    useEffect(() => {
        if (!open) setPrizeRevealed(null);
    }, [open]);

    const canClaimReward = starBalance >= unlockStars && prizes.length > 0;

    const handleClaimPrize = () => {
        if (!onClaimPrize || !canClaimReward) return;
        const prize = onClaimPrize();
        if (prize) setPrizeRevealed(prize);
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
        onUpdatePrizes(prizes.filter((p) => p !== prizeToRemove));
    };

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
                        aria-labelledby="rewards-title"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
                            <div className="flex items-center gap-2">
                                <Gift className="text-purple-600" size={24} aria-hidden />
                                <h2 id="rewards-title" className="text-xl font-bold text-slate-800">
                                    Rewards
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                                aria-label="Close rewards"
                            >
                                <X size={20} aria-hidden />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Prize Pool</h3>
                                    <button
                                        type="button"
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
                                        <div className="text-center text-slate-400 text-sm py-4">No prizes yet. Add some!</div>
                                    ) : (
                                        prizes.map((prize, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 group"
                                            >
                                                <span className="text-sm text-slate-700">{prize}</span>
                                                <button
                                                    type="button"
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

                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4 text-purple-600">
                                    <Gift size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Random reward</h3>
                                <p className="text-slate-500 mb-4 max-w-[260px] text-sm">
                                    First to hit {unlockStars} stars wins 1 random reward. Claiming it resets that player's stars to 0 for the next race.
                                </p>

                                <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 mb-4">
                                    <div className="text-xs text-amber-800 uppercase tracking-wider font-semibold mb-1">Your stars</div>
                                    <div className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
                                        <Star size={20} className="text-amber-500 fill-amber-400" aria-hidden />
                                        {activeUser ? (
                                            <span>
                                                {starBalance} <span className="text-slate-500 font-normal text-sm">({activeUser})</span>
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 font-normal text-sm">Select a user</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-2">Need {unlockStars} stars to unlock the winner reward.</div>
                                </div>

                                {activeUser && !prizeRevealed ? (
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: canClaimReward ? 1.05 : 1 }}
                                        whileTap={{ scale: canClaimReward ? 0.95 : 1 }}
                                        onClick={handleClaimPrize}
                                        disabled={!canClaimReward}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PartyPopper size={20} />
                                        Claim winner reward
                                    </motion.button>
                                ) : !activeUser ? (
                                    <div className="text-sm text-slate-400 bg-slate-50 px-4 py-2 rounded-lg">Select a user to unlock rewards.</div>
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                        className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-6 rounded-2xl shadow-xl w-full"
                                    >
                                        <div className="text-sm text-purple-600 font-bold uppercase mb-2">You got</div>
                                        <div className="text-2xl font-black text-slate-800">{prizeRevealed}</div>
                                        <div className="mt-2 text-sm text-slate-500">Your stars are now reset to 0 for the next race.</div>
                                        <button
                                            type="button"
                                            onClick={() => setPrizeRevealed(null)}
                                            className="mt-4 text-sm text-purple-700 font-medium hover:underline"
                                        >
                                            Back to rewards
                                        </button>
                                    </motion.div>
                                )}

                                {activeUser && !prizeRevealed && !canClaimReward && prizes.length > 0 && (
                                    <p className="text-sm text-slate-400 mt-3">
                                        {starBalance < unlockStars ? `Reach ${unlockStars} stars to unlock the random reward button.` : ""}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
