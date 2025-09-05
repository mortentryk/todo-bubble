import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit3, Check } from "lucide-react";

// --- Utility helpers ---
const randomPastel = () => {
  // HSL pastel colors
  const h = Math.floor(Math.random() * 360);
  const s = 70 + Math.floor(Math.random() * 10); // 70-80
  const l = 80 + Math.floor(Math.random() * 6); // 80-85
  return `hsl(${h} ${s}% ${l}%)`;
};

const uid = () => crypto.randomUUID();

const STORAGE_KEY = "bubbleTodos.v1";

export default function BubbleTodoApp() {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    const t = text.trim();
    if (!t) return;
    setItems((prev) => [
      ...prev,
      { id: uid(), text: t, color: randomPastel(), done: false, createdAt: Date.now() },
    ]);
    setText("");
  };

  const popItem = (id) => {
    // Mark done to trigger style change; removal handled by AnimatePresence exit
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: true } : it)));
    // Actually remove after animation delay
    setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }, 350);
  };

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const renameItem = (id, newText) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, text: newText } : it)));

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "newest") return [...items].sort((a, b) => b.createdAt - a.createdAt);
    if (filter === "oldest") return [...items].sort((a, b) => a.createdAt - b.createdAt);
    return items;
  }, [items, filter]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 p-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Pop-ToDo</h1>
          <div className="flex gap-2 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="all">Sort: manual</option>
              <option value="newest">Sort: newest</option>
              <option value="oldest">Sort: oldest</option>
            </select>
            <button
              onClick={() => setItems([])}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50"
              title="Clear all"
            >
              Clear
            </button>
          </div>
        </header>

        <div className="flex gap-2 mb-6">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Add a todo (press Enter)"
            className="flex-1 rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            onClick={addItem}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow hover:shadow-md active:scale-95 transition"
          >
            <Plus size={18} /> Add
          </button>
        </div>

        <BubbleCloud
          items={filtered}
          popItem={popItem}
          removeItem={removeItem}
          renameItem={renameItem}
          setItems={setItems}
        />

        <footer className="mt-10 text-center text-xs text-slate-500">
          Tip: Click a bubble to pop it. Double‑click text to rename. Drag to reorder on desktop.
        </footer>
      </div>
    </div>
  );
}

function BubbleCloud({ items, popItem, removeItem, renameItem, setItems }) {
  const containerRef = useRef(null);

  // Simple drag-to-reorder (desktop)
  const onDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const onDrop = (e, overId) => {
    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === overId) return;
    const from = items.findIndex((i) => i.id === draggedId);
    const to = items.findIndex((i) => i.id === overId);
    if (from === -1 || to === -1) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-[40vh] rounded-3xl bg-white p-4 shadow-lg border border-slate-200"
    >
      <AnimatePresence>
        <div className="flex flex-wrap gap-3">
          {items.map((it) => (
            <motion.div
              key={it.id}
              layout
              draggable
              onDragStart={(e) => onDragStart(e, it.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, it.id)}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <Bubble
                text={it.text}
                color={it.color}
                onPop={() => popItem(it.id)}
                onRename={(t) => renameItem(it.id, t)}
                onRemove={() => removeItem(it.id)}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {items.length === 0 && (
        <div className="flex items-center justify-center h-[35vh] text-slate-400">
          No todos yet — add one!
        </div>
      )}
    </div>
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
    <div
      className="relative"
      title="Click to pop, double‑click to edit"
    >
      <motion.button
        onClick={onPop}
        onDoubleClick={() => setEditing(true)}
        whileTap={{ scale: 0.9 }}
        className="peer rounded-full px-5 py-4 shadow-md border border-black/5 transition focus:outline-none"
        style={{ background: color }}
      >
        {!editing ? (
          <span className="select-none text-sm font-medium text-slate-800">
            {text}
          </span>
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
