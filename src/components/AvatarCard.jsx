import React, { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";

const AVATAR_EMOJI = {
    Egg: "🥚",
    Fox: "🦊",
    Phoenix: "🦅",
    Dragon: "🐉"
};

export default function AvatarCard({
    activeUser,
    profile,
    xp = 0,
    getAvatarName,
    getProgress,
    onRemoveUser
}) {
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        setConfirming(false);
    }, [activeUser]);

    if (!activeUser) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-700">Avatar</div>
                <div className="text-xs text-slate-400 mt-1">Select a user to start leveling your pet.</div>
            </div>
        );
    }

    const stars = profile?.stars ?? 0;
    const progress = getProgress(xp);
    const avatarName = getAvatarName(progress.level);
    const avatarEmoji = AVATAR_EMOJI[avatarName] || "🥚";

    const handleRemove = () => {
        onRemoveUser?.(activeUser);
        setConfirming(false);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Avatar</div>
                    <div className="truncate text-sm font-semibold text-slate-800">{activeUser}</div>
                    <div className="text-xs text-slate-500">{avatarName}</div>
                </div>
                <div className="text-3xl leading-none" aria-label={avatarName} title={avatarName}>
                    {avatarEmoji}
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between text-sm gap-2">
                <span className="font-semibold text-slate-800">Level {progress.level}</span>
                <span className="flex flex-wrap items-center gap-3 text-slate-500">
                    <span className="inline-flex items-center gap-1 text-amber-600 font-medium" title="Battle stars">
                        <Star size={14} className="fill-amber-400 text-amber-500 shrink-0" aria-hidden />
                        {stars}
                    </span>
                    <span>{xp} XP</span>
                </span>
            </div>

            <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-sky-500 transition-all"
                    style={{ width: `${progress.percentToNextLevel}%` }}
                />
            </div>

            <div className="mt-2 text-xs text-slate-500">
                {progress.currentLevelXp}/{progress.neededForNextLevel} XP to next level
            </div>

            {onRemoveUser && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                    {!confirming ? (
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-800 hover:underline"
                        >
                            <Trash2 size={14} aria-hidden />
                            Remove user
                        </button>
                    ) : (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-600">
                                Remove <span className="font-semibold text-slate-800">{activeUser}</span> from this list?
                            </p>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setConfirming(false)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
