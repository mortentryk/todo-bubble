import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Plus, Trash2, Edit3 } from "lucide-react";

// --- Utility helpers ---
const randomPastel = () => {
  const h = Math.floor(Math.random() * 360);
  const s = 70 + Math.floor(Math.random() * 10); // 70-80
  const l = 80 + Math.floor(Math.random() * 6); // 80-85
  return `hsl(${h} ${s}% ${l}%)`;
};

const uid = () => crypto.randomUUID();

const STORAGE_KEY = "bubbleTodos.v3"; // bump version for clean UI + modal

export default function BubbleTodoApp() {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showModal, setShowModal] = useState(false);
  const floatMode = true; // always floating for super clean look

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Bulk add from modal
  const addMany = (texts) => {
    const toAdd = texts
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => ({ id: uid(), text: t, color: randomPastel(), done: false, createdAt: Date.now() }));
    if (toAdd.length) setItems((prev) => [...prev, ...toAdd]);
  };

  const popItem = (id) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: true } : it)));
    setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }, 350);
  };

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const renameItem = (id, newText) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, text: newText } : it)));

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-sky-50 to-slate-100 text-slate-800">
      <div className="mx-auto max-w-5xl p-6">
        {/* Bubbles only */}
        <BubbleCloud
          items={items}
          popItem={popItem}
          removeItem={removeItem}
          renameItem={renameItem}
          setItems={setItems}
          floatMode={floatMode}
        />

        {/* Floating Add button */}
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-4 text-white shadow-lg hover:shadow-xl active:scale-95"
          title="Add bubbles"
        >
          <Plus size={18} /> Add
        </button>

        {/* Modal for bulk add */}
        <AddTodosModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onAdd={(lines) => {
            addMany(lines);
            setShowModal(false);
          }}
        />
      </div>
    </div>
  );
}

function AddTodosModal({ open, onClose, onAdd }) {
  const [text, setText] = useState("");

  const lines = useMemo(() => {
    return text
      .split(/
?
|,/) // support comma or newline
      .map((s) => s.trim())
      .filter(Boolean);
  }, [text]);

  const handleAdd = () => {
    onAdd(lines);
    setText("");
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
              placeholder={"One per line (or comma-separated)
Example:
Laundry
Vacuum
Call mom"}
              rows={7}
              className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
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

function BubbleCloud({ items, popItem, removeItem, renameItem, setItems, floatMode }) {
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
        "min-h-[70vh] rounded-3xl bg-white/80 p-4 shadow-lg border border-slate-200 overflow-hidden " +
        (floatMode ? "relative" : "")
      }
    >
      <AnimatePresence>
        {floatMode ? (
          // Absolute-positioned floating bubbles
          <div className="relative w-full h-[70vh]">
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
        <div className="flex items-center justify-center h-[50vh] text-slate-400">
          Click "Add" to create your first bubble!
        </div>
      )}
    </div>
  );
}

function FloatingBubble({ text, onPop, onRename, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  useEffect(() => setDraft(text), [text]);

  // Subtle breathing animation
  const controls = useAnimation();
  useEffect(() => {
    let mounted = true;
    const loop = async () => {
      while (mounted) {
        await controls.start({ scale: 1.04, transition: { duration: 1.5 } });
        await controls.start({ scale: 0.98, transition: { duration: 1.5 } });
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
    <motion.div animate={controls} className="relative">
      <button
        onClick={onPop}
        onDoubleClick={() => setEditing(true)}
        className="peer rounded-full w-full h-full shadow-md border border-white/40 focus:outline-none"
        style={{
          background:
            "radial-gradient(120% 120% at 30% 30%, rgba(255,255,255,0.9) 0%, rgba(173,216,230,0.5) 35%, rgba(135,206,235,0.35) 60%, rgba(255,255,255,0.15) 100%)",
          backdropFilter: "blur(2px)",
        }}
        title="Click to pop, double‑click to edit"
      >
        {!editing ? (
          <span className="select-none text-sm font-medium text-slate-800" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.6)" }}>
            {text}
          </span>
        ) : (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="rounded-full px-3 py-1 text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/70"
          />
        )}
      </button>

      {/* Hover controls */}
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 peer-hover:opacity-100 transition">
        <button
          onClick={() => setEditing((v) => !v)}
          className="inline-flex items-center justify-center rounded-full bg-white/90 p-1 shadow border border-slate-200"
          title="Rename"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={onRemove}
          className="inline-flex items-center justify-center rounded-full bg-white/90 p-1 shadow border border-slate-200"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function Bubble({ text, color, onPop, onRename, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  useEffect(() => setDraft(text), [text]);

  const commit = () => {
    const t = draft.trim();
    if (!t) return;
    onRename(t);
    setEditing(false);
  };

  return (
    <div className="relative" title="Click to pop, double‑click to edit">
      <motion.button
        onClick={onPop}
        onDoubleClick={() => setEditing(true)}
        whileTap={{ scale: 0.9 }}
        className="peer rounded-full px-5 py-4 shadow-md border border-black/5 transition focus:outline-none"
        style={{ background: color }}
      >
        {!editing ? (
          <span className="select-none text-sm font-medium text-slate-800">{text}</span>
        ) : (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="rounded-full px-3 py-1 text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white/60"
          />
        )}
      </motion.button>

      {/* Hover controls */}
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 peer-hover:opacity-100 transition">
        <button
          onClick={() => setEditing((v) => !v)}
          className="inline-flex items-center justify-center rounded-full bg-white/90 p-1 shadow border border-slate-200"
          title="Rename"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={onRemove}
          className="inline-flex items-center justify-center rounded-full bg-white/90 p-1 shadow border border-slate-200"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
