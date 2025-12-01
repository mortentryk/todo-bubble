import React, { useState } from "react";
import { User, Plus, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserSelector({ users, selectedUsers, onToggleUser, onAdd }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");

    const handleAdd = (e) => {
        e.preventDefault();
        const name = newName.trim();
        if (name) {
            onAdd(name);
            onToggleUser(name);
            setNewName("");
            setIsAdding(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* User Chips */}
            {users.map((user) => {
                const isSelected = selectedUsers.includes(user);
                return (
                    <button
                        key={user}
                        onClick={() => onToggleUser(user)}
                        className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${isSelected
                                ? "bg-slate-800 text-white shadow-md scale-105"
                                : "bg-white/60 text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"}
            `}
                    >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
                            <User size={10} />
                        </div>
                        {user}
                    </button>
                );
            })}

            {/* Add User Button / Form */}
            <AnimatePresence mode="wait">
                {!isAdding ? (
                    <motion.button
                        key="add-btn"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setIsAdding(true)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/60 text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all border border-transparent hover:border-slate-200"
                        title="Add User"
                    >
                        <Plus size={16} />
                    </motion.button>
                ) : (
                    <motion.form
                        key="add-form"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        onSubmit={handleAdd}
                        className="flex items-center gap-1 bg-white rounded-full pl-3 pr-1 py-1 shadow-sm border border-slate-200 overflow-hidden"
                    >
                        <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Name..."
                            className="w-24 text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-700 placeholder:text-slate-400"
                        />
                        <button
                            type="submit"
                            disabled={!newName.trim()}
                            className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-600 disabled:opacity-50 transition-colors"
                        >
                            <Check size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
