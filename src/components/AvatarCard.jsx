import React from "react";

const AVATAR_EMOJI = {
    Egg: "🥚",
    Fox: "🦊",
    Phoenix: "🦅",
    Dragon: "🐉"
};

export default function AvatarCard({ activeUser, profile, getAvatarName, getProgress }) {
    if (!activeUser) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-700">Avatar</div>
                <div className="text-xs text-slate-400 mt-1">Select a user to start leveling your pet.</div>
            </div>
        );
    }

    const xp = profile?.xp || 0;
    const progress = getProgress(xp);
    const avatarName = getAvatarName(progress.level);
    const avatarEmoji = AVATAR_EMOJI[avatarName] || "🥚";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Avatar</div>
                    <div className="text-sm font-semibold text-slate-800">{activeUser}</div>
                </div>
                <div className="text-3xl leading-none" aria-label={avatarName} title={avatarName}>
                    {avatarEmoji}
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">Level {progress.level}</span>
                <span className="text-slate-500">{progress.currentXp} XP</span>
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
        </div>
    );
}
