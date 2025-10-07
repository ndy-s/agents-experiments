import { handleAgentMessage } from "../../services/agent-service.js";
import { getNumber } from "../../utils/messaging.js";

export async function handleText(sock, msg) {
    const remoteJid = msg.key.remoteJid;
    const isGroup = remoteJid.endsWith("@g.us");

    if (isGroup) {
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const botNumber = getNumber(sock.user.lid || sock.user.id);

        if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage && !mentions.includes(botNumber)) {
            return;
        }
    }

    try {
        await sock.sendPresenceUpdate("composing", remoteJid);

        await handleAgentMessage(sock, msg);

        await sock.sendPresenceUpdate("paused", remoteJid);
    } catch (err) {
        console.error("❌ Agent error:", err);
        await sock.sendMessage(remoteJid, {
            text: "Sorry, something went wrong processing your message.",
        });

        await sock.sendPresenceUpdate("paused", remoteJid);
    }
}

