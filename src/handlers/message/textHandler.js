import { handleAgentMessage } from "../../services/agentService.js";

export async function handleText(sock, msg) {
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    try {
        const reply = await handleAgentMessage(text);
        await sock.sendMessage(msg.key.remoteJid, { text: reply });
    } catch (err) {
        console.error("❌ Agent error:", err);
        await sock.sendMessage(msg.key.remoteJid, {
            text: "⚠️ Sorry, something went wrong processing your message.",
        });
    }
}
