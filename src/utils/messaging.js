
export function getNumber(jid) {
    if (!jid) return "";

    const atIndex = jid.indexOf("@");
    if (atIndex === -1) {
        const colonIndex = jid.indexOf(":");
        return colonIndex === -1 ? jid : jid.slice(0, colonIndex);
    }

    const colonBeforeAt = jid.lastIndexOf(":", atIndex - 1);
    const local = colonBeforeAt === -1 ? jid.slice(0, atIndex) : jid.slice(0, colonBeforeAt);
    const domain = jid.slice(atIndex);
    return local + domain;
}

export function splitBySentence(text, maxLen = 300) {
    const sentences = text.match(/[^.!?]+[.!?]?(?=\s|$)/g) || [];
    const chunks = [];
    let current = "";

    for (const sentence of sentences) {
        let cleaned = sentence.trim();

        // Remove #, ^, *, ~ anywhere in the string
        cleaned = cleaned.replace(/[#^*~]/g, "");
        // Remove . and ! only at the end of the string
        cleaned = cleaned.replace(/[.!]+$/, "");

        if ((current + " " + cleaned).trim().length > maxLen) {
            if (current) chunks.push(current.trim());
            current = cleaned;
        } else {
            current += (current ? " " : "") + cleaned;
        }
    }

    if (current) chunks.push(current.trim());

    return chunks;
}

export function calculateTypingDelay(text, cps = 45) {
    const chars = text.length;
    const baseMs = (chars / cps) * 1000;
    const jitter = Math.random() * 500;
    return baseMs + jitter;
}

export async function sendChunksWithTyping(sock, remoteJid, chunks, replyTarget, quotedMsg = null) {
    await sock.sendPresenceUpdate("composing", remoteJid);

    for (let i = 0; i < chunks.length; i++) {
        if (i !== 0) {
            const delay = calculateTypingDelay(chunks[i]);
            const intervalCount = Math.max(Math.floor(chunks[i].length / 10), 1);
            const interval = delay / intervalCount;

            for (let j = 0; j < intervalCount; j++) {
                await new Promise((r) => setTimeout(r, interval));
                await sock.sendPresenceUpdate("composing", remoteJid);
            }
        }

        await sock.sendMessage(
            remoteJid,
            { text: chunks[i], mentions: [replyTarget] },
            i === 0 ? { quoted: quotedMsg } : {}
        );
    }

    await sock.sendPresenceUpdate("paused", remoteJid);
}

export async function sendAIResponse(sock, remoteJid, text, replyMsg) {
    const chunks = splitBySentence(text, 50);
    await sendChunksWithTyping(sock, remoteJid, chunks, replyMsg.key.participant || remoteJid, replyMsg);
}

