import { getAIClient } from "./ai-clients/index.js";
import { pendingApiCalls, PENDING_TIMEOUT } from "./pending-api.js";

export async function handleAgentMessage(userMessage, msgKey, sock) {
    try {
        const aiClient = getAIClient();
        let response = await aiClient.processUserInput(userMessage);

        let message;
        if (!response.inScope) {
            message = "Maaf, saya cuma bisa bantu soal pinjaman (LNO8888C.SVC) atau portofolio (LNO8888D.SVC) ya.";
        } else if (response.action === "response") {
            message = response.text;
        } else if (response.action === "api_call") {
            const { api, params } = response;
            const missingFields = [];

            if (api === "LNO8888D.SVC") {
                if (!params.pgmType) missingFields.push("jenis program (pgmType)");
                if (!params.refNo) missingFields.push("nomor referensi (refNo)");
            }
            if (api === "LNO8888C.SVC" && !params.prdCd) missingFields.push("kode produk (prdCd)");

            if (missingFields.length > 0) {
                message = `Eh, kayaknya ada yang kurang nih: ${missingFields.join(", ")}. Bisa isi dulu sebelum kita lanjut?`;
            } else {
                const sentMsg = await sock.sendMessage(msgKey.remoteJid, {
                    text: `Kamu yakin ingin mengeksekusi panggilan API ke ${api} dengan parameter:\n${JSON.stringify(params, null, 2)}\n\nReact dengan 👍 untuk setuju.`,
                });

                pendingApiCalls[sentMsg.key.id] = {
                    userJid: msgKey.remoteJid,
                    api,
                    params,
                    timeout: setTimeout(async () => {
                        if (pendingApiCalls[sentMsg.key.id]) {
                            await sock.sendMessage(msgKey.remoteJid, {
                                text: "⏰ Panggilan API dibatalkan karena sudah lewat batas waktu.",
                                edit: sentMsg.key,
                            });
                            delete pendingApiCalls[sentMsg.key.id];
                        }
                    }, PENDING_TIMEOUT),
                };
            }
        } else {
            message = "Ups, sepertinya ada masalah";
        }

        return message;
    } catch (e) {
        console.error("API error:", e);
        return "Ups, sepertinya ada masalah";
    }
}