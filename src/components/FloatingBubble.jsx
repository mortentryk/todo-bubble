import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { Edit3, Trash2, Star, Calendar } from "lucide-react";

export default function FloatingBubble({ text, onPop, onRename, onRemove, score, isWeekly }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(text);
    const [isHovered, setIsHovered] = useState(false);
    useEffect(() => setDraft(text), [text]);

    // Gentle breathing animation
    const controls = useAnimation();
    useEffect(() => {
        let mounted = true;
        const loop = async () => {
            while (mounted) {
                await controls.start({
                    scale: 1.02,
                    transition: { duration: 3, ease: "easeInOut" }
                });
                await controls.start({
                    scale: 0.98,
                    transition: { duration: 3, ease: "easeInOut" }
                });
            }
        };
        loop();
        return () => {
            mounted = false;
        };
    }, [controls]);

    const commit = () => {
        const t = draft.trim();
        if (!t) return;
        onRename(t);
        setEditing(false);
    };

    return (
        <motion.div
            animate={controls}
            className="relative"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <motion.button
                onClick={onPop}
                onDoubleClick={() => setEditing(true)}
                className="peer rounded-full w-full h-full focus:outline-none relative overflow-hidden"
                style={{
                    background: `
                        radial-gradient(circle at 30% 30%, 
                            rgba(255, 255, 255, 0.95) 0%,
                            rgba(255, 255, 255, 0.85) 20%,
                            rgba(220, 235, 250, 0.7) 50%,
                            rgba(200, 225, 245, 0.6) 80%,
                            rgba(180, 215, 240, 0.5) 100%
                        )
                    `,
                    boxShadow: isHovered
                        ? `
                            0 8px 24px rgba(180, 215, 240, 0.4),
                            0 2px 8px rgba(200, 225, 245, 0.3),
                            inset -10px -10px 20px rgba(255, 255, 255, 0.8),
                            inset 10px 10px 20px rgba(200, 225, 245, 0.3),
                            0 0 0 2px rgba(220, 235, 250, 0.4)
                        `
                        : `
                            0 4px 16px rgba(180, 215, 240, 0.3),
                            0 1px 4px rgba(200, 225, 245, 0.2),
                            inset -8px -8px 16px rgba(255, 255, 255, 0.7),
                            inset 8px 8px 16px rgba(200, 225, 245, 0.25),
                            0 0 0 1px rgba(220, 235, 250, 0.3)
                        `,
                    border: `1.5px solid rgba(255, 255, 255, 0.6)`,
                    backdropFilter: 'blur(2px)',
                    transition: "all 0.2s ease",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Click to pop, double‑click to edit"
            >
                {/* Main highlight - classic bubble shine */}
                <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        top: '18%',
                        left: '22%',
                        width: '38%',
                        height: '38%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 40%, transparent 70%)',
                        filter: 'blur(6px)',
                    }}
                />

                {/* Secondary subtle highlight */}
                <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        bottom: '25%',
                        right: '25%',
                        width: '25%',
                        height: '25%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                        filter: 'blur(4px)',
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 p-4">
                    {!editing ? (
                        <>
                            <span
                                className="select-none text-sm font-semibold text-slate-700 text-center leading-tight"
                                style={{
                                    textShadow: "0 1px 2px rgba(255,255,255,0.8)"
                                }}
                            >
                                {text}
                            </span>

                            {/* Score and Weekly badges */}
                            {(score && score !== 5) || isWeekly ? (
                                <div className="flex gap-1.5 items-center">
                                    {score && score !== 5 && (
                                        <div className="flex items-center gap-0.5 bg-white/90 px-2 py-0.5 rounded-full border border-yellow-300 shadow-sm">
                                            <Star size={10} className="text-yellow-600 fill-yellow-500" />
                                            <span className="text-[10px] font-bold text-yellow-700">{score}</span>
                                        </div>
                                    )}
                                    {isWeekly && (
                                        <div className="bg-white/90 px-1.5 py-0.5 rounded-full border border-purple-300 shadow-sm">
                                            <Calendar size={10} className="text-purple-600" />
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={commit}
                            onKeyDown={(e) => e.key === "Enter" && commit()}
                            className="rounded-full px-3 py-1.5 text-sm border-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white shadow-lg text-center font-medium"
                        />
                    )}
                </div>
            </motion.button>

            {/* Hover controls */}
            {isHovered && (
                <div className="absolute -top-2 -right-2 flex gap-1.5">
                    <motion.button
                        onClick={() => setEditing((v) => !v)}
                        className="inline-flex items-center justify-center rounded-full bg-white shadow-lg border border-blue-300 p-1.5 hover:bg-blue-50 transition-colors"
                        title="Rename"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Edit3 size={14} className="text-blue-600" />
                    </motion.button>
                    <motion.button
                        onClick={onRemove}
                        className="inline-flex items-center justify-center rounded-full bg-white shadow-lg border border-red-300 p-1.5 hover:bg-red-50 transition-colors"
                        title="Delete"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Trash2 size={14} className="text-red-600" />
                    </motion.button>
                </div>
            )}
        </motion.div>
    );
}
