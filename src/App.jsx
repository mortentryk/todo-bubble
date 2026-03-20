import React, { useEffect, useState } from "react";
import { Plus, Trophy, Gift, Goal } from "lucide-react";
import BubbleCloud from "./components/BubbleCloud";
import AddTodosModal from "./components/AddTodosModal";
import StatsModal from "./components/StatsModal";
import RewardsModal from "./components/RewardsModal";
import UserSelector from "./components/UserSelector";
import GoalsPage from "./components/GoalsPage";
import AvatarCard from "./components/AvatarCard";
import { randomPastel, uid, getLevelProgress, getAvatarByLevel } from "./utils/helpers";

const STORAGE_KEY = "bubbleTodos.v3";
const HISTORY_KEY = "bubbleTodos.history";
const USER_KEY = "bubbleTodos.user";
const USERS_LIST_KEY = "bubbleTodos.users";
const WEEKLY_KEY = "bubbleTodos.weekly";
const PRIZES_KEY = "bubbleTodos.prizes";
const GOALS_KEY = "bubbleTodos.goals.v1";
const TINY_TASKS_KEY = "bubbleTodos.tinyTasks.v1";
const AVATAR_KEY = "bubbleTodos.avatarProfiles";

export default function BubbleTodoApp() {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    const [history, setHistory] = useState(() => {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    const [activeUser, setActiveUser] = useState(() => {
        const current = localStorage.getItem(USER_KEY);
        return current || "";
    });

    const [users, setUsers] = useState(() => {
        try {
            const raw = localStorage.getItem(USERS_LIST_KEY);
            const list = raw ? JSON.parse(raw) : [];
            // Ensure current user is in the list
            const current = localStorage.getItem(USER_KEY);
            if (current && !list.includes(current)) {
                list.push(current);
            }
            return list;
        } catch {
            return [];
        }
    });

    const [weeklyRegistry, setWeeklyRegistry] = useState(() => {
        try {
            const raw = localStorage.getItem(WEEKLY_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    const [prizes, setPrizes] = useState(() => {
        try {
            const raw = localStorage.getItem(PRIZES_KEY);
            return raw ? JSON.parse(raw) : [
                "Free Coffee ☕",
                "High Five ✋",
                "Bragging Rights 👑",
                "10 Minute Break 🧘",
                "Choose the Music 🎵",
                "Sweet Treat 🍬",
                "Early Finish 🏃",
                "VIP Status 🌟"
            ];
        } catch {
            return [];
        }
    });

    const [showModal, setShowModal] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showRewards, setShowRewards] = useState(false);
    const [showAvatar, setShowAvatar] = useState(false);
    const [currentView, setCurrentView] = useState("bubbles");
    const floatMode = true;
    const [goals, setGoals] = useState(() => {
        try {
            const raw = localStorage.getItem(GOALS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const [tinyTasks, setTinyTasks] = useState(() => {
        try {
            const raw = localStorage.getItem(TINY_TASKS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });
    const [avatarProfiles, setAvatarProfiles] = useState(() => {
        try {
            const raw = localStorage.getItem(AVATAR_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    useEffect(() => {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        if (activeUser) {
            localStorage.setItem(USER_KEY, activeUser);
        } else {
            localStorage.removeItem(USER_KEY);
        }
    }, [activeUser]);

    useEffect(() => {
        localStorage.setItem(WEEKLY_KEY, JSON.stringify(weeklyRegistry));
    }, [weeklyRegistry]);

    useEffect(() => {
        localStorage.setItem(PRIZES_KEY, JSON.stringify(prizes));
    }, [prizes]);

    useEffect(() => {
        localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    }, [goals]);

    useEffect(() => {
        localStorage.setItem(TINY_TASKS_KEY, JSON.stringify(tinyTasks));
    }, [tinyTasks]);

    useEffect(() => {
        localStorage.setItem(AVATAR_KEY, JSON.stringify(avatarProfiles));
    }, [avatarProfiles]);

    const ensureAvatarProfile = (name) => {
        if (!name) return;
        setAvatarProfiles((prev) => {
            if (prev[name]) return prev;
            return {
                ...prev,
                [name]: {
                    xp: 0,
                    level: 1,
                    mood: "happy",
                    lastFedAt: Date.now()
                }
            };
        });
    };

    useEffect(() => {
        if (activeUser) ensureAvatarProfile(activeUser);
    }, [activeUser]);

    // Check for weekly tasks to respawn
    useEffect(() => {
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        const toRespawn = weeklyRegistry.filter(w => {
            // If never popped, or popped more than a week ago
            const ready = !w.lastPoppedAt || (now - w.lastPoppedAt > oneWeek);
            // And not currently in items (check by text to avoid duplicates if ID changed)
            const alreadyExists = items.some(i => i.text === w.text);
            return ready && !alreadyExists;
        });

        if (toRespawn.length > 0) {
            const newItems = toRespawn.map(w => ({
                id: uid(),
                text: w.text,
                color: randomPastel(),
                done: false,
                createdAt: Date.now(),
                score: w.score,
                isWeekly: true,
                weeklyId: w.id // link back to registry
            }));
            setItems(prev => [...prev, ...newItems]);
        }
    }, [weeklyRegistry, items]); // Run when registry loads/changes, items check is implicitly handled on mount/update

    // Bulk add from modal
    const addMany = (texts, options = {}) => {
        const { score = 5, isWeekly = false } = options;
        const now = Date.now();

        const newItems = texts
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
            .map((t) => {
                const id = uid();
                return {
                    id,
                    text: t,
                    color: randomPastel(),
                    done: false,
                    createdAt: now,
                    score,
                    isWeekly,
                    weeklyId: isWeekly ? uid() : null
                };
            });

        if (newItems.length) {
            setItems((prev) => [...prev, ...newItems]);

            if (isWeekly) {
                const newRegistryItems = newItems.map(it => ({
                    id: it.weeklyId,
                    text: it.text,
                    score: it.score,
                    lastPoppedAt: null
                }));
                setWeeklyRegistry(prev => [...prev, ...newRegistryItems]);
            }
        }
    };

    const popItem = (id) => {
        const item = items.find((it) => it.id === id);
        if (!item) return;
        if (!activeUser) {
            window.alert("Select a user before popping bubbles.");
            return;
        }

        // Immediate removal from active list
        setItems((prev) => prev.filter((it) => it.id !== id));

        // Add to history for the active user only
        const historyEntry = {
            ...item,
            poppedAt: Date.now(),
            poppedBy: activeUser
        };
        setHistory((prev) => [...prev, historyEntry]);

        const xpGain = item.score || 5;
        setAvatarProfiles((prev) => {
            const existing = prev[activeUser] || {
                xp: 0,
                level: 1,
                mood: "happy",
                lastFedAt: Date.now()
            };
            const nextXp = existing.xp + xpGain;
            return {
                ...prev,
                [activeUser]: {
                    ...existing,
                    xp: nextXp,
                    level: getLevelProgress(nextXp).level
                }
            };
        });

        // Update weekly registry if applicable
        if (item.isWeekly && item.weeklyId) {
            setWeeklyRegistry(prev => prev.map(w =>
                w.id === item.weeklyId ? { ...w, lastPoppedAt: Date.now() } : w
            ));
        }
    };

    const removeItem = (id) => {
        const item = items.find(it => it.id === id);
        setItems((prev) => prev.filter((it) => it.id !== id));
        // If removing a weekly item manually (not popping), maybe we should remove from registry too?
        // For now, let's assume "delete" means "I don't want this task anymore".
        if (item?.isWeekly && item.weeklyId) {
            setWeeklyRegistry(prev => prev.filter(w => w.id !== item.weeklyId));
        }
    };

    const renameItem = (id, newText) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, text: newText } : it)));
        // Also update registry if it's weekly
        const item = items.find(it => it.id === id);
        if (item?.isWeekly && item.weeklyId) {
            setWeeklyRegistry(prev => prev.map(w => w.id === item.weeklyId ? { ...w, text: newText } : w));
        }
    };

    const handleAddUser = (name) => {
        if (!users.includes(name)) {
            setUsers(prev => [...prev, name]);
        }
        ensureAvatarProfile(name);
        setActiveUser(name);
    };

    const selectUser = (user) => {
        ensureAvatarProfile(user);
        setActiveUser(user);
    };

    const handleUserDoubleTap = (user) => {
        if (activeUser === user) {
            // Toggle avatar visibility for current user
            setShowAvatar(prev => !prev);
        } else {
            // Switch to this user and show avatar
            ensureAvatarProfile(user);
            setActiveUser(user);
            setShowAvatar(true);
        }
    };

    const activeAvatarProfile = activeUser ? avatarProfiles[activeUser] : null;

    const addGoal = (title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        setGoals((prev) => [
            ...prev,
            {
                id: uid(),
                title: trimmed,
                createdAt: Date.now()
            }
        ]);
    };

    const addTinyTask = (goalId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        setTinyTasks((prev) => [
            ...prev,
            {
                id: uid(),
                goalId,
                text: trimmed,
                done: false,
                createdAt: Date.now()
            }
        ]);
    };

    const toggleTinyTaskDone = (taskId) => {
        setTinyTasks((prev) =>
            prev.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
        );
    };

    const sendTinyTaskToBubble = (taskId) => {
        const task = tinyTasks.find((t) => t.id === taskId);
        if (!task) return;
        addMany([task.text], { score: 3, isWeekly: false });
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-sky-50 to-slate-100 text-slate-800 font-sans">
            <div className="mx-auto max-w-5xl p-3 sm:p-6">
                {/* Header / Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div className="w-full sm:max-w-lg flex flex-col gap-3">
                        <UserSelector
                            users={users}
                            activeUser={activeUser}
                            onSelectUser={selectUser}
                            onAdd={handleAddUser}
                            onDoubleTap={handleUserDoubleTap}
                        />
                        {showAvatar && (
                            <AvatarCard
                                activeUser={activeUser}
                                profile={activeAvatarProfile}
                                getAvatarName={getAvatarByLevel}
                                getProgress={getLevelProgress}
                            />
                        )}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setCurrentView("goals")}
                            className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow transition-all font-medium text-sm ${currentView === "goals"
                                    ? "bg-slate-900 text-white"
                                    : "bg-white/80 hover:bg-white text-slate-600"
                                }`}
                        >
                            <Goal size={16} className={currentView === "goals" ? "text-emerald-300" : "text-emerald-500"} />
                            Goals
                        </button>
                        <button
                            onClick={() => setShowStats(true)}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white shadow-sm hover:shadow transition-all text-slate-600 font-medium text-sm"
                        >
                            <Trophy size={16} className="text-yellow-500" />
                            Stats
                        </button>
                        <button
                            onClick={() => setShowRewards(true)}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-sm hover:shadow transition-all text-white font-medium text-sm"
                        >
                            <Gift size={16} />
                            Rewards
                        </button>
                        {currentView === "goals" && (
                            <button
                                onClick={() => setCurrentView("bubbles")}
                                className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white shadow-sm hover:shadow transition-all text-slate-600 font-medium text-sm"
                            >
                                Back
                            </button>
                        )}
                    </div>
                </div>

                {currentView === "bubbles" ? (
                    <BubbleCloud
                        items={items}
                        popItem={popItem}
                        removeItem={removeItem}
                        renameItem={renameItem}
                        setItems={setItems}
                        floatMode={floatMode}
                    />
                ) : (
                    <GoalsPage
                        goals={goals}
                        tinyTasks={tinyTasks}
                        onAddGoal={addGoal}
                        onAddTinyTask={addTinyTask}
                        onToggleTinyTaskDone={toggleTinyTaskDone}
                        onSendTinyTaskToBubble={sendTinyTaskToBubble}
                    />
                )}

                {/* Floating Add button */}
                {currentView === "bubbles" && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 sm:px-5 sm:py-4 text-white shadow-lg hover:shadow-xl active:scale-95 transition-transform z-40"
                        title="Add bubbles"
                    >
                        <Plus size={18} /> Add
                    </button>
                )}

                {/* Modals */}
                <AddTodosModal
                    open={showModal}
                    onClose={() => setShowModal(false)}
                    onAdd={(lines, options) => {
                        addMany(lines, options);
                        setShowModal(false);
                    }}
                />

                <StatsModal
                    open={showStats}
                    onClose={() => setShowStats(false)}
                    history={history}
                    activeUser={activeUser}
                />

                <RewardsModal
                    open={showRewards}
                    onClose={() => setShowRewards(false)}
                    history={history}
                    activeUser={activeUser}
                    prizes={prizes}
                    onUpdatePrizes={setPrizes}
                />
            </div>
        </div>
    );
}
