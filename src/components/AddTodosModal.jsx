import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Star } from "lucide-react";

export default function AddTodosModal({ open, onClose, onAdd }) {
    const [text, setText] = useState("");
    const [score, setScore] = useState(5);
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
        setScore(5);
        setIsWeekly(false);
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleAdd();
        };
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        className="absolute left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-3">Add bubbles</h2>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={"One per line (or comma-separated)\nExample:\nLaundry\nVacuum\nCall mom"}
                            rows={5}
                            className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 mb-4"
                        />

                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                <Star size={16} className="text-yellow-500" />
                                <span className="text-sm font-medium text-slate-600">Score:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={score}
                                    onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                                    className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            <label className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
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

                        <div className="flex items-center justify-between text-sm text-slate-500">
                            <span>{lines.length} item{lines.length === 1 ? "" : "s"} ready</span>
                            <div className="flex gap-2">
                                <button onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2 shadow-sm hover:bg-slate-50">Cancel</button>
                                <button
                                    onClick={handleAdd}
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-white shadow hover:shadow-md disabled:opacity-40"
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
