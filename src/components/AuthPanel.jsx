import React, { useState } from "react";
import { LogIn, LogOut, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AuthPanel({ session, idSuffix = "" }) {
  const emailFieldId = `auth-email${idSuffix}`;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const user = session?.user ?? null;
  const isEmailUser = Boolean(user?.email && !user?.is_anonymous);
  const isAnon = Boolean(user?.is_anonymous);

  async function handleSendLink(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !supabase) return;
    setBusy(true);
    const redirectTo = `${window.location.origin}${window.location.pathname || "/"}`;
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true
      }
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage("Check your email for the sign-in link.");
  }

  async function handleSignOut() {
    if (!supabase) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    const { error: err } = await supabase.auth.signOut();
    setBusy(false);
    if (err) setError(err.message);
  }

  if (!supabase) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-sm text-sm">
      {isEmailUser ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-slate-600 min-w-0">
            <Mail size={16} className="shrink-0 text-sky-600" aria-hidden />
            <span className="truncate" title={user.email}>
              {user.email}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium disabled:opacity-50"
          >
            <LogOut size={14} aria-hidden />
            Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={handleSendLink} className="flex flex-col gap-2">
          {isAnon && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
              Sign in with email to sync this app on your phone and laptop.
            </p>
          )}
          {!user && (
            <p className="text-xs text-slate-500">
              Sign in with email (magic link) for cloud sync across devices.
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <label className="sr-only" htmlFor={emailFieldId}>
              Email
            </label>
            <input
              id={emailFieldId}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            />
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-white font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              <LogIn size={16} aria-hidden />
              Send link
            </button>
          </div>
          {message && <p className="text-xs text-emerald-700">{message}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
