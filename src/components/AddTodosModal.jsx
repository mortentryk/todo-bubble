import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Star } from "lucide-react";

export default function AddTodosModal({ open, onClose, onAdd }) {
    const [text, setText] = useState("");
    const [score, setScore] = useState(1);
    const [isWeekly, setIsWeekly] = useState(false);

    const lines = useMemo(() => {
        return text
            .split(/[\n,]/) // support comma or newline
            .map((s) => s.trim())
            .filter(Boolean);
    }, [text]);

    const handleAdd = () => {
        onAdd(lines, { score, isWeekly });
        setText("");
        setScore(1);
        setIsWeekly(false);
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                handleAdd();
            }
        };
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, handleAdd, lines.length]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="backdrop"
                    role="presentation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-3 sm:p-0"
                    onClick={onClose}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-bubbles-title"
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        className="absolute inset-x-3 bottom-3 sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:w-[92vw] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 rounded-2xl bg-white p-4 sm:p-5 shadow-2xl border border-slate-200 max-h-[82dvh] sm:max-h-[86vh] overflow-y-auto"
                        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="add-bubbles-title" className="text-lg font-semibold mb-3">Add bubbles</h2>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={"One per line (or comma-separated)\nExample:\nLaundry\nVacuum\nCall mom"}
                            rows={4}
                            className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 mb-4"
                        />

                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                            <div className="flex w-full items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 sm:w-auto">
                                <Star size={16} className="text-yellow-500" />
                                <span className="text-sm font-medium text-slate-600">Score:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={score}
                                    onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                                    className="ml-auto w-16 bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            <label className="flex w-full items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors sm:w-auto">
                                <input
                                    type="checkbox"
                                    checked={isWeekly}
                                    onChange={(e) => setIsWeekly(e.target.checked)}
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                <Calendar size={16} className="text-purple-500" />
                                <span className="text-sm font-medium text-slate-600">Weekly Task</span>
                            </label>
                        </div>

                        <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                            <span>{lines.length} item{lines.length === 1 ? "" : "s"} ready</span>
                            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                                <button onClick={onClose} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 shadow-sm hover:bg-slate-50 sm:w-auto">Cancel</button>
                                <button
                                    onClick={handleAdd}
                                    className="w-full rounded-xl bg-slate-900 px-4 py-2 text-white shadow hover:shadow-md disabled:opacity-40 sm:w-auto"
                                    disabled={!lines.length}
                                >
                                    Add {lines.length ? `(${lines.length})` : ""}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
