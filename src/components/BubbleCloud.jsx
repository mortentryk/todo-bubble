import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FloatingBubble from "./FloatingBubble";

export default function BubbleCloud({ items, popItem, removeItem, renameItem, setItems, floatMode }) {
    const containerRef = useRef(null);

    // --- FLOAT PHYSICS ---
    const [positions, setPositions] = useState({}); // id -> {x,y,r,phase}
    const rafRef = useRef(null);

    // Size based on text length (keeps UI readable)
    const radiusFor = (txt) => {
        const len = Math.max(1, txt.length);
        const r = 28 + Math.min(28, Math.sqrt(len) * 6); // 28px..56px
        return r;
    };

    // Initialize positions when items change
    useEffect(() => {
        if (!floatMode) return;
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setPositions((prev) => {
            const next = { ...prev };
            items.forEach((it) => {
                if (!next[it.id]) {
                    const r = radiusFor(it.text);
                    const x = Math.random() * Math.max(1, rect.width - r * 2) + r;
                    const y = Math.random() * Math.max(1, rect.height - r * 2) + r;
                    next[it.id] = { x, y, r, phase: Math.random() * Math.PI * 2 };
                } else {
                    next[it.id] = { ...next[it.id], r: radiusFor(it.text) };
                }
            });
            // remove stale
            Object.keys(next).forEach((id) => {
                if (!items.find((i) => i.id === id)) delete next[id];
            });
            return next;
        });
    }, [items, floatMode]);

    useEffect(() => {
        if (!floatMode) return;
        const el = containerRef.current;
        if (!el) return;
        const rect = () => el.getBoundingClientRect();

        const tick = () => {
            setPositions((prev) => {
                const n = { ...prev };
                const { width, height } = rect();
                const t = performance.now() / 1000;
                const buoyancy = 8; // px/sec upward
                const sideDrift = 16; // max px/sec sideways from sin wave
                const bob = 6; // vertical bob amplitude

                for (const id in n) {
                    const p = n[id];
                    const freq = 0.7 + (parseInt(id.slice(-2), 16) % 40) / 100; // 0.7..1.1 Hz-ish
                    // horizontal sine drift
                    const vx = Math.sin(t * freq + p.phase) * sideDrift * 0.016; // ~60fps
                    // move
                    p.x += vx;
                    p.y -= buoyancy * 0.016 + Math.sin(t * (freq + 0.3) + p.phase) * (bob * 0.016);
                    // walls
                    p.x = Math.max(p.r, Math.min(width - p.r, p.x));
                    if (p.y < -p.r) p.y = height + p.r; // wrap from top to bottom
                    if (p.y > height + p.r) p.y = -p.r; // just in case
                }
                return n;
            });
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [floatMode]);

    return (
        <div
            ref={containerRef}
            className={
                "min-h-[62vh] sm:min-h-[70vh] rounded-3xl bg-white/80 p-2 sm:p-4 shadow-lg border border-slate-200 overflow-hidden " +
                (floatMode ? "relative" : "")
            }
        >
            <AnimatePresence>
                {floatMode ? (
                    // Absolute-positioned floating bubbles
                    <div className="relative w-full h-[62vh] sm:h-[70vh]">
                        {items.map((it) => {
                            const p = positions[it.id];
                            const r = p?.r ?? radiusFor(it.text);
                            const x = p?.x ?? r;
                            const y = p?.y ?? r;
                            return (
                                <motion.div
                                    key={it.id}
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 1.4, opacity: 0, transition: { duration: 0.3 } }}
                                    className="absolute group"
                                    style={{ left: x - r, top: y - r, width: r * 2, height: r * 2 }}
                                >
                                    <FloatingBubble
                                        text={it.text}
                                        score={it.score}
                                        isWeekly={it.isWeekly}
                                        color={it.color}
                                        onPop={() => popItem(it.id)}
                                        onRemove={() => removeItem(it.id)}
                                        onRename={(t) => renameItem(it.id, t)}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                ) : null}
            </AnimatePresence>

            {items.length === 0 && (
                <div className="flex items-center justify-center h-[44vh] sm:h-[50vh] text-slate-400 text-center px-4">
                    Click "Add" to create your first bubble!
                </div>
            )}
        </div>
    );
}
