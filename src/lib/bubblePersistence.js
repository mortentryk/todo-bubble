import { supabase } from "./supabase";

/** Storage keys (legacy localStorage + migration source). */
export const STORAGE_KEY = "bubbleTodos.v3";
export const HISTORY_KEY = "bubbleTodos.history";
export const USER_KEY = "bubbleTodos.user";
export const USERS_LIST_KEY = "bubbleTodos.users";
export const WEEKLY_KEY = "bubbleTodos.weekly";
export const PRIZES_KEY = "bubbleTodos.prizes";
export const GOALS_KEY = "bubbleTodos.goals.v1";
export const TINY_TASKS_KEY = "bubbleTodos.tinyTasks.v1";
export const AVATAR_KEY = "bubbleTodos.avatarProfiles";

export const DEFAULT_PRIZES = [
  "Free Coffee ☕",
  "High Five ✋",
  "Bragging Rights 👑",
  "10 Minute Break 🧘",
  "Choose the Music 🎵",
  "Sweet Treat 🍬",
  "Early Finish 🏃",
  "VIP Status 🌟"
];

export function getEmptyBubbleState() {
  return {
    items: [],
    history: [],
    activeUser: "",
    users: [],
    weeklyRegistry: [],
    prizes: [...DEFAULT_PRIZES],
    goals: [],
    tinyTasks: [],
    avatarProfiles: {}
  };
}

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Synchronous load from localStorage (local-only mode or migration). */
export function loadSnapshotFromLocalStorage() {
  const empty = getEmptyBubbleState();
  const items = safeParse(localStorage.getItem(STORAGE_KEY), []);
  const history = safeParse(localStorage.getItem(HISTORY_KEY), []);
  const activeUser = localStorage.getItem(USER_KEY) || "";
  let users = safeParse(localStorage.getItem(USERS_LIST_KEY), []);
  if (activeUser && Array.isArray(users) && !users.includes(activeUser)) {
    users = [...users, activeUser];
  }
  const weeklyRegistry = safeParse(localStorage.getItem(WEEKLY_KEY), []);
  const prizesRaw = localStorage.getItem(PRIZES_KEY);
  const prizes = prizesRaw ? safeParse(prizesRaw, empty.prizes) : [...DEFAULT_PRIZES];
  const goals = safeParse(localStorage.getItem(GOALS_KEY), []);
  const tinyTasks = safeParse(localStorage.getItem(TINY_TASKS_KEY), []);
  const avatarProfiles = safeParse(localStorage.getItem(AVATAR_KEY), {});

  return {
    ...empty,
    items: Array.isArray(items) ? items : [],
    history: Array.isArray(history) ? history : [],
    activeUser,
    users: Array.isArray(users) ? users : [],
    weeklyRegistry: Array.isArray(weeklyRegistry) ? weeklyRegistry : [],
    prizes: Array.isArray(prizes) && prizes.length ? prizes : [...DEFAULT_PRIZES],
    goals: Array.isArray(goals) ? goals : [],
    tinyTasks: Array.isArray(tinyTasks) ? tinyTasks : [],
    avatarProfiles: avatarProfiles && typeof avatarProfiles === "object" ? avatarProfiles : {}
  };
}

function snapshotHasData(s) {
  if (!s) return false;
  return (
    (s.items && s.items.length > 0) ||
    (s.history && s.history.length > 0) ||
    (s.users && s.users.length > 0) ||
    (s.weeklyRegistry && s.weeklyRegistry.length > 0) ||
    (s.goals && s.goals.length > 0) ||
    (s.tinyTasks && s.tinyTasks.length > 0) ||
    (s.avatarProfiles && Object.keys(s.avatarProfiles).length > 0) ||
    Boolean(s.activeUser && String(s.activeUser).trim())
  );
}

/**
 * Load snapshot from Supabase `user_state` row for the current user.
 */
export async function loadSnapshotFromSupabase(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("user_state")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[bubble] load user_state:", error.message);
    return null;
  }
  if (!data?.data || typeof data.data !== "object") return null;
  return normalizeSnapshot(data.data);
}

function normalizeSnapshot(raw) {
  const base = getEmptyBubbleState();
  return {
    ...base,
    items: Array.isArray(raw.items) ? raw.items : base.items,
    history: Array.isArray(raw.history) ? raw.history : base.history,
    activeUser: typeof raw.activeUser === "string" ? raw.activeUser : base.activeUser,
    users: Array.isArray(raw.users) ? raw.users : base.users,
    weeklyRegistry: Array.isArray(raw.weeklyRegistry) ? raw.weeklyRegistry : base.weeklyRegistry,
    prizes:
      Array.isArray(raw.prizes) && raw.prizes.length ? raw.prizes : [...DEFAULT_PRIZES],
    goals: Array.isArray(raw.goals) ? raw.goals : base.goals,
    tinyTasks: Array.isArray(raw.tinyTasks) ? raw.tinyTasks : base.tinyTasks,
    avatarProfiles:
      raw.avatarProfiles && typeof raw.avatarProfiles === "object"
        ? raw.avatarProfiles
        : base.avatarProfiles
  };
}

export async function saveSnapshotToSupabase(userId, snapshot) {
  if (!supabase || !userId) return;
  const payload = {
    user_id: userId,
    data: snapshot,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("user_state").upsert(payload, {
    onConflict: "user_id"
  });
  if (error) console.error("[bubble] save user_state:", error.message);
}

/**
 * Load remote state for `userId`. If remote is empty but `seedSnapshot` or localStorage has data, upload once.
 * `seedSnapshot` is the in-memory snapshot (e.g. before switching from anonymous to email user).
 */
export async function loadSnapshotForUser(userId, seedSnapshot) {
  if (!userId) {
    return { snapshot: normalizeSnapshot(seedSnapshot ?? loadSnapshotFromLocalStorage()) };
  }

  let remote = await loadSnapshotFromSupabase(userId);
  const local = seedSnapshot ?? loadSnapshotFromLocalStorage();

  if (!remote || !snapshotHasData(remote)) {
    if (snapshotHasData(local)) {
      remote = local;
      await saveSnapshotToSupabase(userId, remote);
    } else {
      remote = remote || getEmptyBubbleState();
    }
  }

  return { snapshot: normalizeSnapshot(remote) };
}

export function writeSnapshotToLocalStorage(snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.items));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(snapshot.history));
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(snapshot.users));
    if (snapshot.activeUser) {
      localStorage.setItem(USER_KEY, snapshot.activeUser);
    } else {
      localStorage.removeItem(USER_KEY);
    }
    localStorage.setItem(WEEKLY_KEY, JSON.stringify(snapshot.weeklyRegistry));
    localStorage.setItem(PRIZES_KEY, JSON.stringify(snapshot.prizes));
    localStorage.setItem(GOALS_KEY, JSON.stringify(snapshot.goals));
    localStorage.setItem(TINY_TASKS_KEY, JSON.stringify(snapshot.tinyTasks));
    localStorage.setItem(AVATAR_KEY, JSON.stringify(snapshot.avatarProfiles));
  } catch {
    /* quota */
  }
}
