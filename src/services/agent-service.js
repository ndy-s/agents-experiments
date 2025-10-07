import { getAIClient } from "./ai-clients/index.js";
import { pendingApiCalls, PENDING_TIMEOUT } from "./pending-api.js";
import { sendAIResponse } from "../utils/messaging.js";

export async function handleAgentMessage(sock, msg) {
    try {
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

        const aiClient = getAIClient();
        const response = await aiClient.processUserInput(text);
        const msgKey = msg.key;

        if (!response.inScope) {
            await sock.sendMessage(
                msgKey.remoteJid, 
                { text: "Sorry, I can only help with loan creation (LNO8888C.SVC) or portfolio manipulation (LNO8888D.SVC) requests." }, 
                { quoted: msg }
            );
            return;
        }

        if (response.action === "response") {
            // await sock.sendMessage(
            //     msgKey.remoteJid,
            //     { text: response.text },
            //     { quoted: msg }
            // );
            await sendAIResponse(sock, msgKey.remoteJid, response.text, msg);
            return;
        }

        if (response.action === "api_call") {
            const calls = response.apiCalls;
            const baseTimeout = PENDING_TIMEOUT;

            for (let i = 0; i < calls.length; i++) {
                const { api, params } = calls[i];

                const missingFields = [];
                if (api === "LNO8888D.SVC") {
                    if (!params.pgmType) missingFields.push("program type (pgmType)");
                    if (!params.refNo) missingFields.push("reference number (refNo)");
                }
                if (api === "LNO8888C.SVC" && !params.prdCd) missingFields.push("product code (prdCd)");
                if (missingFields.length > 0) {
                    await sock.sendMessage(
                        msgKey.remoteJid,
                        { text: `It looks like some fields are missing: ${missingFields.join(", ")}. Please fill them in before we continue.` },
                        { quoted: msg }
                    );
                    return;
                }

                const adjustedTimeout = baseTimeout + i * 15000;
                const totalSeconds = Math.floor(adjustedTimeout / 1000);

                const sentMsg = await sock.sendMessage(
                    msgKey.remoteJid,
                    { text: formatPendingMessage(api, params, totalSeconds) },
                    { quoted: msg }
                );

                pendingApiCalls[sentMsg.key.id] = {
                    userJid: msgKey.remoteJid,
                    api,
                    params,
                    msgKey: sentMsg.key,
                    timeout: setTimeout(async () => {
                        const pending = pendingApiCalls[sentMsg.key.id];
                        if (!pending) return;

                        await sock.sendMessage(pending.userJid, {
                            text: `⏰ API call *${pending.api}* cancelled (no confirmation received).`,
                            edit: pending.msgKey,
                        });

                        delete pendingApiCalls[sentMsg.key.id];
                    }, PENDING_TIMEOUT),
                };
            }

            return;
        }

        await sock.sendMessage(
            msgKey.remoteJid, 
            { text: "Oops, something went wrong while processing your request." }, 
            { quoted: msg }
        );
    } catch (error) {
        console.error("❌ Agent error:", error);
        await sock.sendMessage(
            msgKey.remoteJid, 
            { text: "Oops, something went wrong while processing your request." }, 
            { quoted: msg }
        );
    }
}

function formatPendingMessage(api, params, totalSeconds) {
    return `Please confirm your API call to *${api}*.\n${JSON.stringify(params, null, 2)}\n\nReact 👍 to confirm within ${totalSeconds}s`;
}
