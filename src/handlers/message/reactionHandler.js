import { pendingApiCalls } from "../../services/pending-api.js";

export async function handleReaction(sock, msg) {
    const reactionMsg = msg.message.reactionMessage;
    if (!reactionMsg) return;

    const msgId = reactionMsg.key.id;
    const chatId = msg.key.remoteJid;
    const emoji = reactionMsg.text;

    const pending = pendingApiCalls[msgId];
    if (!pending) return;

    if (emoji === "👍") {
        clearTimeout(pending.timeout);
        try {
            // const result = await callBackendAPI(pending.api, pending.params); // implement your backend call
            const result = "SUCCESS";
            await sock.sendMessage(chatId, {text: `✅ API executed successfully: ${JSON.stringify(result)}`});
        } catch (err) {
            console.error("API execution error:", err);
            await sock.sendMessage(chatId, {text: "❌ API execution failed."});
        }
        delete pendingApiCalls[msgId];
    }
}