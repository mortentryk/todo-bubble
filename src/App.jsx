import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trophy, Gift, Goal, BarChart3 } from "lucide-react";
import BubbleCloud from "./components/BubbleCloud";
import AddTodosModal from "./components/AddTodosModal";
import StatsModal from "./components/StatsModal";
import RewardsModal from "./components/RewardsModal";
import UserSelector from "./components/UserSelector";
import GoalsPage from "./components/GoalsPage";
import AvatarCard from "./components/AvatarCard";
import BattlePage from "./components/BattlePage";
import SignInModal from "./components/SignInModal";
import { randomPastel, uid, getLevelProgress, getAvatarByLevel } from "./utils/helpers";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import {
    getEmptyBubbleState,
    loadSnapshotFromLocalStorage,
    loadSnapshotForUser,
    saveSnapshotToSupabase,
    writeSnapshotToLocalStorage
} from "./lib/bubblePersistence";

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

function initialBubbleState() {
    if (!isSupabaseConfigured()) {
        return loadSnapshotFromLocalStorage();
    }
    return getEmptyBubbleState();
}

export default function BubbleTodoApp() {
    const boot = initialBubbleState();
    const [items, setItems] = useState(() => boot.items);
    const DEFAULT_FOCUS_MINUTES = 20;
    const [now, setNow] = useState(Date.now());
    const [history, setHistory] = useState(() => boot.history);
    const [activeUser, setActiveUser] = useState(() => boot.activeUser);
    const [users, setUsers] = useState(() => boot.users);
    const [weeklyRegistry, setWeeklyRegistry] = useState(() => boot.weeklyRegistry);
    const [prizes, setPrizes] = useState(() => boot.prizes);
    const [showModal, setShowModal] = useState(false);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showRewards, setShowRewards] = useState(false);
    const [showAvatar, setShowAvatar] = useState(false);
    const [needUserHint, setNeedUserHint] = useState(false);
    const [currentView, setCurrentView] = useState("bubbles");
    const floatMode = true;
    const [goals, setGoals] = useState(() => boot.goals);
    const [tinyTasks, setTinyTasks] = useState(() => boot.tinyTasks);
    const [avatarProfiles, setAvatarProfiles] = useState(() =>
        migrateAvatarProfiles(boot.avatarProfiles)
    );

    const [hydrated, setHydrated] = useState(() => !isSupabaseConfigured());
    const [authReady, setAuthReady] = useState(() => !isSupabaseConfigured());
    const [session, setSession] = useState(null);
    const saveTimerRef = useRef(null);
    const snapshotRef = useRef(null);

    useEffect(() => {
        if (!isSupabaseConfigured() || !supabase) return;
        let cancelled = false;
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (cancelled) return;
            setSession(s);
            setAuthReady(true);
        });
        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((_event, s) => {
            if (cancelled) return;
            setSession(s);
        });
        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    const snapshot = useMemo(
        () => ({
            items,
            history,
            activeUser,
            users,
            weeklyRegistry,
            prizes,
            goals,
            tinyTasks,
            avatarProfiles
        }),
        [
            items,
            history,
            activeUser,
            users,
            weeklyRegistry,
            prizes,
            goals,
            tinyTasks,
            avatarProfiles
        ]
    );

    snapshotRef.current = snapshot;

    const hydrationKey = `${session?.user?.id ?? "none"}:${session?.user?.is_anonymous ? "anon" : "auth"}`;

    useEffect(() => {
        if (!isSupabaseConfigured() || !supabase) return;
        if (!authReady) return;
        let cancelled = false;
        setHydrated(false);
        (async () => {
            const user = session?.user;
            if (!user) {
                const s = loadSnapshotFromLocalStorage();
                if (cancelled) return;
                setItems(s.items);
                setHistory(s.history);
                setActiveUser(s.activeUser);
                setUsers(s.users);
                setWeeklyRegistry(s.weeklyRegistry);
                setPrizes(s.prizes);
                setGoals(s.goals);
                setTinyTasks(s.tinyTasks);
                setAvatarProfiles(migrateAvatarProfiles(s.avatarProfiles));
                setHydrated(true);
                return;
            }
            const seed = snapshotRef.current;
            const { snapshot: snap } = await loadSnapshotForUser(user.id, seed);
            if (cancelled) return;
            setItems(snap.items);
            setHistory(snap.history);
            setActiveUser(snap.activeUser);
            setUsers(snap.users);
            setWeeklyRegistry(snap.weeklyRegistry);
            setPrizes(snap.prizes);
            setGoals(snap.goals);
            setTinyTasks(snap.tinyTasks);
            setAvatarProfiles(migrateAvatarProfiles(snap.avatarProfiles));
            setHydrated(true);
        })();
        return () => {
            cancelled = true;
        };
    }, [authReady, hydrationKey]);

    useEffect(() => {
        if (!hydrated) return;
        if (!isSupabaseConfigured() || !supabase) {
            writeSnapshotToLocalStorage(snapshot);
            return;
        }
        const uid = session?.user?.id;
        if (!uid) {
            writeSnapshotToLocalStorage(snapshot);
            return;
        }
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveSnapshotToSupabase(uid, snapshot);
        }, 450);
        return () => clearTimeout(saveTimerRef.current);
    }, [snapshot, hydrated, session?.user?.id]);

    useEffect(() => {
        if (session?.user) setShowSignInModal(false);
    }, [session]);

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

    const handleRemoveUser = (name) => {
        setAvatarProfiles((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
        setHistory((prev) => prev.filter((h) => h.poppedBy !== name));
        setUsers((prev) => {
            const next = prev.filter((u) => u !== name);
            setActiveUser((cur) => (cur === name ? (next[0] ?? "") : cur));
            return next;
        });
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

    const reorderGoals = (orderedIds) => {
        setGoals((prev) => {
            const byId = Object.fromEntries(prev.map((g) => [g.id, g]));
            return orderedIds.map((id) => byId[id]).filter(Boolean);
        });
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(12);
        }
    };

    const moveGoal = (goalId, direction) => {
        setGoals((prev) => {
            const idx = prev.findIndex((g) => g.id === goalId);
            if (idx === -1) return prev;
            const next = [...prev];
            if (direction === "up" && idx > 0) {
                [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            } else if (direction === "down" && idx < next.length - 1) {
                [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            } else if (direction === "top" && idx > 0) {
                const [item] = next.splice(idx, 1);
                next.unshift(item);
            } else {
                return prev;
            }
            return next;
        });
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(12);
        }
    };

    const removeGoal = (goalId) => {
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
        setTinyTasks((prev) => prev.filter((t) => t.goalId !== goalId));
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
                parentTaskId: null,
                done: false,
                createdAt: Date.now()
            }
        ]);
    };

    const addTinySubTask = (goalId, parentTaskId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        setTinyTasks((prev) => [
            ...prev,
            {
                id: uid(),
                goalId,
                parentTaskId,
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
        if (!task) return false;
        addMany([task.text], { score: 3, isWeekly: false });
        return true;
    };

    const removeTinyTask = (taskId) => {
        setTinyTasks((prev) => {
            const stack = [taskId];
            const removeIds = new Set([taskId]);
            while (stack.length > 0) {
                const current = stack.pop();
                for (const task of prev) {
                    if (task.parentTaskId === current && !removeIds.has(task.id)) {
                        removeIds.add(task.id);
                        stack.push(task.id);
                    }
                }
            }
            return prev.filter((t) => !removeIds.has(t.id));
        });
    };

    if (isSupabaseConfigured() && (!authReady || !hydrated)) {
        return (
            <div className="min-h-dvh w-full flex items-center justify-center bg-gradient-to-b from-sky-50 to-slate-100 text-slate-600">
                <p className="text-sm font-medium">Loading…</p>
            </div>
        );
    }

    const email = session?.user?.email;
    const isEmailSession = Boolean(email && !session?.user?.is_anonymous);
    const isGuestSession = Boolean(session?.user?.is_anonymous);
    const storageHint = !isSupabaseConfigured()
        ? "Your data is stored in this browser."
        : isEmailSession
          ? "Synced to your account (same data on phone and laptop)."
          : isGuestSession
            ? "Guest: saved for this browser session. Add your email below to sync across devices."
            : "Sign in with email below to sync across devices.";

    return (

<div className="min-h-dvh w-full bg-gradient-to-b from-sky-50 to-slate-100 text-slate-800 font-sans">
            <div className="mx-auto max-w-5xl p-3 pb-24 sm:p-6 sm:pb-28">
                {/* Header / Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div className="w-full sm:max-w-lg flex flex-col gap-3">
                        <UserSelector
                            users={users}
                            activeUser={activeUser}
                            onSelectUser={selectUser}
                            onAdd={handleAddUser}
                            onDoubleTap={handleUserDoubleTap}
                            requireEmailToAddUser={isSupabaseConfigured() && !session?.user}
                            onAddUserBlocked={() => setShowSignInModal(true)}
                        />
                        {showAvatar && (
                            <AvatarCard
                                activeUser={activeUser}
                                profile={activeAvatarProfile}
                                getAvatarName={getAvatarByLevel}
                                getProgress={getLevelProgress}
                                onRemoveUser={handleRemoveUser}
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:flex-wrap md:flex-nowrap">
                        <button
                            onClick={() => setCurrentView("goals")}
                            className={`min-w-0 justify-center flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow transition-all font-medium text-sm ${currentView === "goals"
                                    ? "bg-slate-900 text-white"
                                    : "bg-white/80 hover:bg-white text-slate-600"
                                }`}
                        >
                            <Goal size={16} className={currentView === "goals" ? "text-emerald-300" : "text-emerald-500"} />
                            Goals
                        </button>
                        <button
                            onClick={() => setCurrentView("battle")}
                            className={`min-w-0 justify-center flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow transition-all font-medium text-sm ${currentView === "battle"
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
                            className="min-w-0 justify-center flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white shadow-sm hover:shadow transition-all text-slate-600 font-medium text-sm"
                            aria-label="Open stats and leaderboard"
                        >
                            <BarChart3 size={16} className="text-sky-600" />
                            Stats
                        </button>
                        <button
                            onClick={() => setShowRewards(true)}
                            className="min-w-0 justify-center flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-sm hover:shadow transition-all text-white font-medium text-sm"
                        >
                            <Gift size={16} />
                            Rewards
                        </button>
                        {(currentView === "goals" || currentView === "battle") && (
                            <button
                                onClick={() => setCurrentView("bubbles")}
                                className="min-w-0 justify-center flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white shadow-sm hover:shadow transition-all text-slate-600 font-medium text-sm"
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
                        onReorderGoals={reorderGoals}
                        onMoveGoal={moveGoal}
                        onRemoveGoal={removeGoal}
                        onAddTinyTask={addTinyTask}
                        onAddTinySubTask={addTinySubTask}
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
                        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
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

                <p className="mt-8 text-center text-xs text-slate-400 px-2">{storageHint}</p>

                <SignInModal
                    open={showSignInModal}
                    onClose={() => setShowSignInModal(false)}
                    session={session}
                />
            </div>
        </div>
    );
}
