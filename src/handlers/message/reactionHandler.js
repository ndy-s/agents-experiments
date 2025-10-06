import { callBackendAPI } from "../../services/api-service.js";
import { pendingApiCalls } from "../../services/pending-api.js";

export async function handleReaction(sock, msg) {
    try {
        const reaction = msg.message.reactionMessage;
        if (!reaction) return;

        const reactedMsgId = reaction.key.id;
        const reactionEmoji = reaction.text;
        const reactor = msg.key.participant || msg.key.remoteJid;

        const pending = pendingApiCalls[reactedMsgId];
        if (!pending) return; 

        if (reactor !== pending.userJid) {
            return;
        }

        if (reactionEmoji !== "👍") {
            return; 
        }

        clearTimeout(pending.timeout);
        delete pendingApiCalls[reactedMsgId];

        await sock.sendMessage(
            pending.userJid, 
            {
                text: `✅ Confirmed! Executing *${pending.api}* with parameters:\n${JSON.stringify(pending.params, null, 2)}\n\n⏳ Please wait...`,
                edit: pending.msgKey, 
            }
        );

        try {
            const result = await callBackendAPI(pending.api, pending.params);

            let resultText = JSON.stringify(result, null, 2);
            if (resultText.length > 1000) {
                resultText = resultText.slice(0, 1000) + "\n... (truncated)";
            }

            await sock.sendMessage(
                pending.userJid, 
                { 
                    text: `🎉 *${pending.api}* API executed successfully!\n\nResult:\n${resultText}`, 
                    edit: pending.msgKey
                }
            );
        } catch (apiError) {
            console.error("API call failed:", apiError);
        }
    } catch (error) {
        console.error("❌ handleReaction error:", error);
    }
}


