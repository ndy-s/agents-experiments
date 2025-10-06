import { handleAgentMessage } from "../../services/agent-service.js";

export async function handleText(sock, msg) {
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    try {
        const reply = await handleAgentMessage(text, msg.key, sock);
        await sock.sendMessage(msg.key.remoteJid, {
            text: reply,
            contextInfo: {
                quotedMessage: msg.message,
            }
        });
    } catch (err) {
        console.error("❌ Agent error:", err);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "⚠️ Sorry, something went wrong processing your message.",
        });
    }
}
