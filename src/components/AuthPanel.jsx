import React, { useState } from "react";
import { LogIn, LogOut, Mail, UserCircle, KeyRound } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AuthPanel({ session, idSuffix = "", onGuestSignedIn }) {
  const emailFieldId = `auth-email${idSuffix}`;
  const passwordFieldId = `auth-password${idSuffix}`;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password"); // "password" | "magic"
  const [isSignUp, setIsSignUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const user = session?.user ?? null;
  const isEmailUser = Boolean(user?.email && !user?.is_anonymous);
  const isAnon = Boolean(user?.is_anonymous);

  function resetStatus() {
    setError(null);
    setMessage(null);
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    resetStatus();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password || !supabase) return;
    setBusy(true);
    if (isSignUp) {
      const redirectTo = `${window.location.origin}${window.location.pathname || "/"}`;
      const { data, error: err } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: { emailRedirectTo: redirectTo }
      });
      setBusy(false);
      if (err) {
        setError(err.message);
        return;
      }
      if (!data.session) {
        setMessage("Check your email to confirm your account.");
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password
      });
      setBusy(false);
      if (err) {
        setError(err.message);
        return;
      }
    }
  }

  async function handleSendLink(e) {
    e.preventDefault();
    resetStatus();
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

  async function handleForgotPassword() {
    resetStatus();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !supabase) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    const redirectTo = `${window.location.origin}${window.location.pathname || "/"}`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage("Check your email for a password reset link.");
  }

  async function handleContinueAsGuest() {
    if (!supabase) return;
    resetStatus();
    setBusy(true);
    const { error: err } = await supabase.auth.signInAnonymously();
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    onGuestSignedIn?.();
  }

  async function handleSignOut() {
    if (!supabase) return;
    resetStatus();
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
        <div className="flex flex-col gap-2">
          {isAnon && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
              Sign in with email to sync this app on your phone and laptop.
            </p>
          )}
          {!user && (
            <p className="text-xs text-slate-500">
              Use the same email &amp; password as your other apps (fitness, diary) to sync everywhere.
            </p>
          )}

          <div className="inline-flex self-start rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                resetStatus();
              }}
              className={`px-2.5 py-1 rounded-md font-medium ${
                mode === "password"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("magic");
                resetStatus();
              }}
              className={`px-2.5 py-1 rounded-md font-medium ${
                mode === "magic"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Magic link
            </button>
          </div>

          {mode === "password" ? (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-2">
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
              <label className="sr-only" htmlFor={passwordFieldId}>
                Password
              </label>
              <input
                id={passwordFieldId}
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              />
              <button
                type="submit"
                disabled={busy || !email.trim() || !password}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-white font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                <KeyRound size={16} aria-hidden />
                {isSignUp ? "Create account" : "Sign in"}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp((v) => !v);
                    resetStatus();
                  }}
                  className="text-sky-700 hover:underline"
                >
                  {isSignUp ? "Have an account? Sign in" : "New here? Create account"}
                </button>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={busy}
                    className="text-slate-500 hover:text-slate-700 hover:underline disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleSendLink} className="flex flex-col gap-2">
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
            </form>
          )}

          {!user && (
            <button
              type="button"
              onClick={handleContinueAsGuest}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <UserCircle size={16} aria-hidden />
              Continue as guest
            </button>
          )}
          {message && <p className="text-xs text-emerald-700">{message}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
