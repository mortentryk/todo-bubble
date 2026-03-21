import React, { useEffect, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FloatingBubble from "./FloatingBubble";

export default function BubbleCloud({ items, popItem, removeItem, renameItem, setItems, floatMode, now, onStartTimer }) {
    const containerRef = useRef(null);
    const positionsRef = useRef({});
    const bubbleElsRef = useRef(new Map());
    const rafRef = useRef(0);
    const lastTsRef = useRef(0);

    const radiusFor = (txt) => {
        const len = Math.max(1, txt.length);
        return 28 + Math.min(28, Math.sqrt(len) * 6);
    };

    const applyFloatTransform = (node, p) => {
        if (!node || !p) return;
        node.style.transform = `translate3d(${p.x - p.r}px, ${p.y - p.r}px, 0)`;
    };

    useLayoutEffect(() => {
        if (!floatMode) return;
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const next = positionsRef.current;
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
        Object.keys(next).forEach((id) => {
            if (!items.find((i) => i.id === id)) delete next[id];
        });
        items.forEach((it) => {
            const p = next[it.id];
            const node = bubbleElsRef.current.get(it.id);
            applyFloatTransform(node, p);
        });
    }, [items, floatMode]);

    useEffect(() => {
        if (!floatMode) return;
        const el = containerRef.current;
        if (!el) return;

        const rect = () => el.getBoundingClientRect();

        const tick = (ts) => {
            const prev = lastTsRef.current;
            lastTsRef.current = ts;
            const dt = prev ? Math.min(0.05, (ts - prev) / 1000) : 1 / 60;

            const { width, height } = rect();
            const t = performance.now() / 1000;
            const buoyancy = 8;
            const sideDrift = 16;
            const bob = 6;
            const next = positionsRef.current;

            for (const id in next) {
                const p = next[id];
                const freq = 0.7 + (parseInt(id.slice(-2), 16) % 40) / 100;
                const vx = Math.sin(t * freq + p.phase) * sideDrift * dt;
                p.x += vx;
                p.y -= buoyancy * dt + Math.sin(t * (freq + 0.3) + p.phase) * (bob * dt);
                p.x = Math.max(p.r, Math.min(width - p.r, p.x));
                if (p.y < -p.r) p.y = height + p.r;
                if (p.y > height + p.r) p.y = -p.r;
            }

            bubbleElsRef.current.forEach((node, id) => {
                applyFloatTransform(node, next[id]);
            });

            rafRef.current = requestAnimationFrame(tick);
        };

        lastTsRef.current = 0;
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [floatMode]);

    return (
        <div
            ref={containerRef}
            className={
                "min-h-[56dvh] sm:min-h-[62vh] lg:min-h-[70vh] rounded-3xl bg-cover bg-center p-2 sm:p-4 shadow-lg border border-slate-200 overflow-hidden " +
                (floatMode ? "relative" : "")
            }
            style={{ backgroundImage: "url('/Videos/sarath-p-co9ncept-2k-final.jpg')" }}
        >
            <AnimatePresence>
                {floatMode ? (
                    <div className="relative w-full h-[56dvh] sm:h-[62vh] lg:h-[70vh]">
                        {items.map((it) => {
                            const p = positionsRef.current[it.id];
                            const r = p?.r ?? radiusFor(it.text);
                            return (
                                <motion.div
                                    key={it.id}
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 1.4, opacity: 0, transition: { duration: 0.3 } }}
                                    className="absolute group left-0 top-0"
                                    style={{
                                        width: r * 2,
                                        height: r * 2,
                                        willChange: "transform"
                                    }}
                                >
                                    <div
                                        ref={(node) => {
                                            if (node) bubbleElsRef.current.set(it.id, node);
                                            else bubbleElsRef.current.delete(it.id);
                                        }}
                                        className="absolute left-0 top-0 w-full h-full"
                                        style={{
                                            transform: "translate3d(0,0,0)",
                                            willChange: "transform"
                                        }}
                                    >
                                        <FloatingBubble
                                            text={it.text}
                                            score={it.score}
                                            isWeekly={it.isWeekly}
                                            color={it.color}
                                            timerEndsAt={it.timerEndsAt}
                                            timerDurationMs={it.timerDurationMs}
                                            now={now}
                                            onPop={() => popItem(it.id)}
                                            onRemove={() => removeItem(it.id)}
                                            onRename={(t) => renameItem(it.id, t)}
                                            onStartTimer={() => onStartTimer(it.id)}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : null}
            </AnimatePresence>

            {items.length === 0 && (
                <div className="flex items-center justify-center h-[40dvh] sm:h-[44vh] lg:h-[50vh] text-slate-400 text-center px-4">
                    Click "Add" to create your first bubble!
                </div>
            )}
        </div>
    );
}
