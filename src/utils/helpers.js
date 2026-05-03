export const randomPastel = () => {
    const h = Math.floor(Math.random() * 360);
    const s = 70 + Math.floor(Math.random() * 10); // 70-80
    const l = 80 + Math.floor(Math.random() * 6); // 80-85
    return `hsl(${h} ${s}% ${l}%)`;
};

export const uid = () => crypto.randomUUID();

export const levelFromXp = (xp = 0) => Math.floor(Math.sqrt(Math.max(0, xp) / 25)) + 1;

export const xpForLevelStart = (level = 1) => {
    const safeLevel = Math.max(1, level);
    return (safeLevel - 1) * (safeLevel - 1) * 25;
};

export const getLevelProgress = (xp = 0) => {
    const safeXp = Math.max(0, xp);
    const level = levelFromXp(safeXp);
    const currentStart = xpForLevelStart(level);
    const nextStart = xpForLevelStart(level + 1);
    const intoLevel = safeXp - currentStart;
    const needed = nextStart - currentStart;
    return {
        level,
        currentXp: safeXp,
        currentLevelXp: intoLevel,
        neededForNextLevel: needed,
        percentToNextLevel: needed > 0 ? Math.min(100, Math.round((intoLevel / needed) * 100)) : 100
    };
};

export const getAvatarByLevel = (level = 1) => {
    if (level >= 10) return "Dragon";
    if (level >= 7) return "Phoenix";
    if (level >= 4) return "Fox";
    return "Egg";
};
