import { supabase } from "./supabase";

const VALID_MOVES = new Set(["rock", "paper", "scissors"]);

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
}

function normalizeMoves(moves) {
  if (!Array.isArray(moves) || moves.length !== 3) {
    throw new Error("Exactly 3 moves are required.");
  }
  const out = moves.map((m) => String(m ?? "").trim().toLowerCase());
  if (!out.every((m) => VALID_MOVES.has(m))) {
    throw new Error("Moves must be rock, paper, or scissors.");
  }
  return out;
}

function randomSalt(length = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i += 1) out += chars[bytes[i] % chars.length];
  return out;
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function ensureOnlineProfile(displayName) {
  requireSupabase();
  const trimmed = String(displayName ?? "").trim();
  if (!trimmed) throw new Error("Display name is required.");
  const { error } = await supabase.rpc("ensure_user_profile", { p_display_name: trimmed });
  if (error) throw error;
}

export async function listOpponentProfiles() {
  requireSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const me = authData?.user?.id;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id,display_name,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).filter((p) => p.user_id !== me);
}

export async function getMyStars() {
  requireSupabase();
  const { data, error } = await supabase.from("user_stars").select("stars").maybeSingle();
  if (error) throw error;
  return typeof data?.stars === "number" ? data.stars : 0;
}

export async function createBattleChallenge(opponentId, starWager, hiddenMoves) {
  requireSupabase();
  const moves = normalizeMoves(hiddenMoves);
  const salt = randomSalt();
  const hash = await sha256Hex(`${moves.join(",")}:${salt}`);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const challengerUserId = authData?.user?.id;
  if (!challengerUserId) throw new Error("You must be signed in.");
  if (!opponentId || opponentId === challengerUserId) throw new Error("Choose another player.");

  const wager = Math.max(1, Number(starWager) || 1);
  const { data, error } = await supabase
    .from("battle_matches")
    .insert({
      challenger_user_id: challengerUserId,
      opponent_user_id: opponentId,
      star_wager: wager,
      challenger_moves_hash: hash,
      challenger_moves_salt: salt
    })
    .select("*")
    .single();
  if (error) throw error;
  return { match: data, reveal: { moves, salt } };
}

export async function submitOpponentMoves(matchId, moves) {
  requireSupabase();
  const normalized = normalizeMoves(moves);
  const { data, error } = await supabase.rpc("submit_battle_opponent_moves", {
    p_match_id: matchId,
    p_moves: normalized
  });
  if (error) throw error;
  return data;
}

export async function revealAndResolveMatch(matchId, challengerMoves, salt) {
  requireSupabase();
  const normalized = normalizeMoves(challengerMoves);
  const { data, error } = await supabase.rpc("resolve_battle_match", {
    p_match_id: matchId,
    p_challenger_moves: normalized,
    p_challenger_salt: String(salt ?? "")
  });
  if (error) throw error;
  return data;
}

export async function listIncomingBattles() {
  requireSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const me = authData?.user?.id;
  if (!me) return [];
  const { data, error } = await supabase
    .from("battle_matches")
    .select("*")
    .eq("opponent_user_id", me)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listOutgoingBattles() {
  requireSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const me = authData?.user?.id;
  if (!me) return [];
  const { data, error } = await supabase
    .from("battle_matches")
    .select("*")
    .eq("challenger_user_id", me)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export function subscribeToBattleMatches(onChange) {
  requireSupabase();
  const channel = supabase
    .channel(`battle-matches-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "battle_matches" },
      () => onChange?.()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
