
export const memoryStore = {
    users: {},
    maxItems: 20,
    maxChars: 5000,
};

export function addMemory(userJid, userMessage, assistantMessage) {
    if (!memoryStore.users[userJid]) memoryStore.users[userJid] = [];

    memoryStore.users[userJid].push({ user: userMessage, assistant: assistantMessage });

    // Trim by maxItems
    while (memoryStore.users[userJid].length > memoryStore.maxItems) {
        memoryStore.users[userJid].shift();
    }

    // Trim by maxChars
    let totalChars = memoryStore.users[userJid].reduce(
        (sum, c) => sum + c.user.length + c.assistant.length,
        0
    );

    while (totalChars > memoryStore.maxChars && memoryStore.users[userJid].length > 0) {
        const removed = memoryStore.users[userJid].shift();
        totalChars -= removed.user.length + removed.assistant.length;
    }
}

export function getMemory(userJid) {
    return memoryStore.users[userJid] || [];
}

export function clearMemory(userJid) {
    delete memoryStore.users[userJid];
}
