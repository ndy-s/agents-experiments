import {getAIClient} from "./ai-clients/index.js";
import {PENDING_TIMEOUT, pendingApiCalls} from "../utils/pending-api.js";
import {sendAIResponse} from "../utils/messaging.js";
import {addMemory, clearMemory, getMemory} from "../utils/memory.js";

export async function handleAgentMessage(sock, msg) {
    try {
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

        const msgKey = msg.key;
        const userJid = msgKey.participant || msgKey.remoteJid;

        let quotedContext = "";
        const quotedMessage = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            const quotedText =
                quotedMessage.conversation ||
                quotedMessage.extendedTextMessage?.text ||
                "";

            quotedContext = `(Replied to assistant: "${quotedText}")`;
        }

        const memoryContext = getMemory(userJid)
            .map(c => `User: ${c.user}\nAssistant: ${c.assistant}`)
            .join("\n\n");

        const userInput = `User input: ${text}`;

        const fullPrompt = [
            memoryContext,
            quotedContext,
            userInput
        ].filter(Boolean)
            .join("\n\n");

        const aiClient = getAIClient();
        const response = await aiClient.processUserInput(fullPrompt);

        if (!response.inScope) {
            await sock.sendMessage(
                msgKey.remoteJid, 
                { text: "Sorry, I can only help with loan creation (LNO8888C.SVC) or portfolio manipulation (LNO8888D.SVC) requests." }, 
                { quoted: msg }
            );
            return;
        }

        if (response.action === "response") {
            await sendAIResponse(sock, msgKey.remoteJid, response.text, msg);
            addMemory(userJid, text, response.text);

            return;
        }

        if (response.action === "api_call") {
            const calls = response.apiCalls;
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

                const adjustedTimeout = PENDING_TIMEOUT + i * 15000;
                const totalSeconds = Math.floor(adjustedTimeout / 1000);

                const sentMsg = await sock.sendMessage(
                    msgKey.remoteJid,
                    { text: formatPendingMessage(api, params, totalSeconds) },
                    { quoted: msg }
                );

                pendingApiCalls[sentMsg.key.id] = {
                    userJid: userJid,
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

            clearMemory(userJid);

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
