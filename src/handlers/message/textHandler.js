import { handleAgentMessage } from "../../services/agent-service.js";

export async function handleText(sock, msg) {
    const remoteJid = msg.key.remoteJid;

    try {
        await sock.sendPresenceUpdate("composing", remoteJid);

        await handleAgentMessage(sock, msg);

        await sock.sendPresenceUpdate("paused", remoteJid);
    } catch (err) {
        console.error("❌ Agent error:", err);
        await sock.sendMessage(remoteJid, {
            text: "⚠️ Sorry, something went wrong processing your message.",
        });

        await sock.sendPresenceUpdate("paused", remoteJid);
    }
}

