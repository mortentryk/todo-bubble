export function isNotificationSupported() {
    return typeof Notification !== "undefined";
}

export function ensureNotificationPermission() {
    if (!isNotificationSupported()) return Promise.resolve("unsupported");
    if (Notification.permission !== "default") {
        return Promise.resolve(Notification.permission);
    }
    return Notification.requestPermission().catch(() => "denied");
}

export function notifyFocusTimerDone({ title, body, tag }) {
    if (!isNotificationSupported()) return false;
    if (Notification.permission !== "granted") return false;

    try {
        const notification = new Notification(title || "Focus timer done", {
            body: body || "A bubble timer finished.",
            tag,
            icon: "/vite.svg"
        });
        notification.onclick = () => {
            if (typeof window !== "undefined") {
                window.focus();
            }
            notification.close();
        };
        return true;
    } catch {
        return false;
    }
}
