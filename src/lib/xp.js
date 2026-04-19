import { supabase } from "./supabase";

export const XP_KEY = "bubbleTodos.xp";

export function loadLocalXp() {
    try {
        const raw = localStorage.getItem(XP_KEY);
        if (raw == null) return 0;
        const n = Number(raw);
        return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
        return 0;
    }
}

export function writeLocalXp(xp) {
    try {
        localStorage.setItem(XP_KEY, String(Math.max(0, Math.floor(xp))));
    } catch {
        /* quota */
    }
}

/** Load the authenticated user's xp from the shared `user_xp` table. */
export async function loadXpFromSupabase(userId) {
    if (!supabase || !userId) return null;
    const { data, error } = await supabase
        .from("user_xp")
        .select("xp")
        .eq("user_id", userId)
        .maybeSingle();
    if (error) {
        console.error("[xp] load user_xp:", error.message);
        return null;
    }
    return typeof data?.xp === "number" ? data.xp : 0;
}

/** Call the `award_xp` RPC. Returns the new total XP, or null on failure. */
export async function awardXp({ amount, source, meta }) {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("award_xp", {
        p_amount: amount,
        p_source: source,
        p_meta: meta ?? {}
    });
    if (error) {
        console.error("[xp] award_xp:", error.message);
        return null;
    }
    return typeof data === "number" ? data : null;
}
