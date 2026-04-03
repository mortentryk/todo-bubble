import React, { useEffect } from "react";
import { X } from "lucide-react";
import AuthPanel from "./AuthPanel";

export default function SignInModal({ open, onClose, session }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200/80 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h2 id="sign-in-modal-title" className="text-lg font-semibold text-slate-800 pr-8">
            Sign in or continue as guest
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-3">
          Use your email for sync everywhere, or continue as a guest to add names on this device only (until you
          sign out or clear site data).
        </p>
        <AuthPanel session={session} idSuffix="-modal" onGuestSignedIn={onClose} />
      </div>
    </div>
  );
}
