export const randomPastel = () => {
    const h = Math.floor(Math.random() * 360);
    const s = 70 + Math.floor(Math.random() * 10); // 70-80
    const l = 80 + Math.floor(Math.random() * 6); // 80-85
    return `hsl(${h} ${s}% ${l}%)`;
};

export const uid = () => crypto.randomUUID();
