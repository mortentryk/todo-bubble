import React, { useEffect, useState } from "react";
import { Plus, Trophy, Gift, Goal, BarChart3 } from "lucide-react";
import BubbleCloud from "./components/BubbleCloud";
import AddTodosModal from "./components/AddTodosModal";
import StatsModal from "./components/StatsModal";
import RewardsModal from "./components/RewardsModal";
import UserSelector from "./components/UserSelector";
import GoalsPage from "./components/GoalsPage";
import AvatarCard from "./components/AvatarCard";
import BattlePage from "./components/BattlePage";
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

/** Battle currency used to unlock rewards. New / legacy profiles without `stars` get this once on load. */
const STARTING_STARS = 0;
const REWARD_UNLOCK_STARS = 50;

function migrateAvatarProfiles(raw) {
    if (!raw || typeof raw !== "object") return {};
    const out = {};
    for (const [name, v] of Object.entries(raw)) {
        if (!v || typeof v !== "object") continue;
        out[name] = {
            ...v,
            stars: typeof v.stars === "number" ? v.stars : STARTING_STARS
        };
    }
    return out;
}

function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* quota or unavailable */
    }
}

export default function BubbleTodoApp() {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    const DEFAULT_FOCUS_MINUTES = 20;
    const [now, setNow] = useState(Date.now());

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
    const [needUserHint, setNeedUserHint] = useState(false);
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
        safeSetItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    useEffect(() => {
        safeSetItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        safeSetItem(USERS_LIST_KEY, JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        try {
            if (activeUser) {
                localStorage.setItem(USER_KEY, activeUser);
            } else {
                localStorage.removeItem(USER_KEY);
            }
        } catch {
            /* ignore */
        }
    }, [activeUser]);

    useEffect(() => {
        safeSetItem(WEEKLY_KEY, JSON.stringify(weeklyRegistry));
    }, [weeklyRegistry]);

    useEffect(() => {
        safeSetItem(PRIZES_KEY, JSON.stringify(prizes));
    }, [prizes]);

    useEffect(() => {
        safeSetItem(GOALS_KEY, JSON.stringify(goals));
    }, [goals]);

    useEffect(() => {
        safeSetItem(TINY_TASKS_KEY, JSON.stringify(tinyTasks));
    }, [tinyTasks]);

    useEffect(() => {
        safeSetItem(AVATAR_KEY, JSON.stringify(avatarProfiles));
    }, [avatarProfiles]);

    useEffect(() => {
        if (!needUserHint) return;
        const t = window.setTimeout(() => setNeedUserHint(false), 4500);
        return () => window.clearTimeout(t);
    }, [needUserHint]);

    useEffect(() => {
        if (activeUser) setNeedUserHint(false);
    }, [activeUser]);

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
                    lastFedAt: Date.now(),
                    stars: STARTING_STARS
                }
            };
        });
    };

    useEffect(() => {
        if (activeUser) ensureAvatarProfile(activeUser);
    }, [activeUser]);

    // Keep "now" fresh only while we're on the bubbles view.
    // (Timer display doesn't need to tick in the other views.)
    useEffect(() => {
        if (currentView !== "bubbles") return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [currentView]);

    const startTimerForItem = (id, minutes = DEFAULT_FOCUS_MINUTES) => {
        const addMs = Math.max(1, minutes) * 60 * 1000;
        const nowMs = Date.now();

        setItems((prev) =>
            prev.map((it) => {
                if (it.id !== id) return it;

                const existingEndsAt = typeof it.timerEndsAt === "number" ? it.timerEndsAt : null;
                const stillActive = typeof existingEndsAt === "number" && existingEndsAt > nowMs;
                const base = stillActive ? existingEndsAt : nowMs;

                return {
                    ...it,
                    timerEndsAt: base + addMs,
                    timerDurationMs: addMs
                };
            })
        );
    };

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
        const { score = 1, isWeekly = false } = options;
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
            setNeedUserHint(true);
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
        // Open XP UI when awarding experience for a completed bubble.
        setShowAvatar(true);
        setAvatarProfiles((prev) => {
            const existing = prev[activeUser] || {
                xp: 0,
                level: 1,
                mood: "happy",
                lastFedAt: Date.now()
            };
            const nextXp = existing.xp + xpGain;
            const nextStars = (existing.stars ?? 0) + xpGain;
            return {
                ...prev,
                [activeUser]: {
                    ...existing,
                    xp: nextXp,
                    level: getLevelProgress(nextXp).level,
                    stars: nextStars
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

    const applyBattleResultToAvatars = ({ player1, player2, winner, loser, isDraw }) => {
        if (!player1 || !player2) return;
        if (isDraw) return;

        setAvatarProfiles((prev) => {
            const ensureProfile = (name) => {
                if (!name) return null;
                if (prev[name]) return prev[name];
                return {
                    xp: 0,
                    level: 1,
                    mood: "happy",
                    lastFedAt: Date.now(),
                    stars: STARTING_STARS
                };
            };

            const pWinner = ensureProfile(winner);
            const pLoser = ensureProfile(loser);
            if (!winner || !loser || !pWinner || !pLoser) return prev;

            const loserStars = Math.max(0, pLoser.stars ?? 0);
            const winnerStars = Math.max(0, pWinner.stars ?? 0);

            return {
                ...prev,
                [winner]: {
                    ...pWinner,
                    stars: winnerStars + loserStars
                },
                [loser]: {
                    ...pLoser,
                    stars: 0
                }
            };
        });

        setShowAvatar(true);
    };

    /** Returns a random prize label and resets the winner's stars for the next race. */
    const claimUnlockedPrize = () => {
        if (!activeUser || prizes.length === 0) return null;
        let revealed = null;
        setAvatarProfiles((prev) => {
            const p = prev[activeUser];
            if (!p) return prev;
            const stars = p.stars ?? 0;
            if (stars < REWARD_UNLOCK_STARS) return prev;
            revealed = prizes[Math.floor(Math.random() * prizes.length)];
            return {
                ...prev,
                [activeUser]: {
                    ...p,
                    stars: 0
                }
            };
        });
        return revealed;
    };

    const addGoal = (title) => {
        const trimmed = title.trim();
        if (!trimmed) return undefined;
        const id = uid();
        setGoals((prev) => [
            ...prev,
            {
                id,
                title: trimmed,
                createdAt: Date.now()
            }
        ]);
        return id;
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
        setShowAvatar(true);
        setTinyTasks((prev) =>
            prev.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
        );
    };

    const sendTinyTaskToBubble = (taskId) => {
        const task = tinyTasks.find((t) => t.id === taskId);
        if (!task) return;
        addMany([task.text], { score: 3, isWeekly: false });
    };

    const removeTinyTask = (taskId) => {
        setTinyTasks((prev) => prev.filter((t) => t.id !== taskId));
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
                            onClick={() => setCurrentView("battle")}
                            className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow transition-all font-medium text-sm ${currentView === "battle"
                                    ? "bg-slate-900 text-white"
                                    : "bg-white/80 hover:bg-white text-slate-600"
                                }`}
                        >
                            <Trophy size={16} className={currentView === "battle" ? "text-yellow-300" : "text-yellow-500"} />
                            Battle
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowStats(true)}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white shadow-sm hover:shadow transition-all text-slate-600 font-medium text-sm"
                            aria-label="Open stats and leaderboard"
                        >
                            <BarChart3 size={16} className="text-sky-600" />
                            Stats
                        </button>
                        <button
                            onClick={() => setShowRewards(true)}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-sm hover:shadow transition-all text-white font-medium text-sm"
                        >
                            <Gift size={16} />
                            Rewards
                        </button>
                        {(currentView === "goals" || currentView === "battle") && (
                            <button
                                onClick={() => setCurrentView("bubbles")}
                                className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white shadow-sm hover:shadow transition-all text-slate-600 font-medium text-sm"
                            >
                                Back
                            </button>
                        )}
                    </div>
                </div>

                {needUserHint && currentView === "bubbles" && (
                    <div
                        className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 shadow-sm flex items-center justify-between gap-2"
                        role="status"
                    >
                        <span>Select a user above before popping bubbles.</span>
                        <button
                            type="button"
                            onClick={() => setNeedUserHint(false)}
                            className="shrink-0 rounded-lg px-2 py-1 text-amber-800 hover:bg-amber-100 font-medium"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {currentView === "bubbles" ? (
                    <BubbleCloud
                        items={items}
                        popItem={popItem}
                        removeItem={removeItem}
                        renameItem={renameItem}
                        setItems={setItems}
                        floatMode={floatMode}
                        now={now}
                        onStartTimer={startTimerForItem}
                    />
                ) : currentView === "battle" ? (
                    <BattlePage
                        users={users}
                        activeUser={activeUser}
                        avatarProfiles={avatarProfiles}
                        getProgress={getLevelProgress}
                        getAvatarName={getAvatarByLevel}
                        onApplyBattleResult={applyBattleResultToAvatars}
                    />
                ) : (
                    <GoalsPage
                        goals={goals}
                        tinyTasks={tinyTasks}
                        onAddGoal={addGoal}
                        onAddTinyTask={addTinyTask}
                        onToggleTinyTaskDone={toggleTinyTaskDone}
                        onSendTinyTaskToBubble={sendTinyTaskToBubble}
                        onRemoveTinyTask={removeTinyTask}
                    />
                )}

                {/* Floating Add button */}
                {currentView === "bubbles" && (
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 sm:px-5 sm:py-4 text-white shadow-lg hover:shadow-xl active:scale-95 transition-transform z-40"
                        title="Add bubbles"
                        aria-label="Add bubbles"
                    >
                        <Plus size={18} aria-hidden /> Add
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
                    avatarProfiles={avatarProfiles}
                />

                <RewardsModal
                    open={showRewards}
                    onClose={() => setShowRewards(false)}
                    activeUser={activeUser}
                    prizes={prizes}
                    onUpdatePrizes={setPrizes}
                    starBalance={activeAvatarProfile?.stars ?? 0}
                    unlockStars={REWARD_UNLOCK_STARS}
                    onClaimPrize={claimUnlockedPrize}
                />

                <p className="mt-8 text-center text-xs text-slate-400 px-2">
                    Try refreshing the page. Your data is stored in this browser.
                </p>
            </div>
        </div>
    );
}
