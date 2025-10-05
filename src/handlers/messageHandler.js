import { handleMedia } from "./message/mediaHandler.js";
import { handleSticker } from "./message/stickerHandler.js";
import { handleText } from "./message/textHandler.js";
import { config } from "../config/env.js";

export async function messageHandler(sock, msg) {
    const message = msg.message;
    if (!message) return;

    const remoteJid = msg.key.remoteJid;

    if (!config.whitelist.includes(remoteJid)) {
        console.log(`🚫 Ignored non-whitelisted sender: ${remoteJid}`);
        return;
    }

    console.log(`📩 Message from ${remoteJid}:`, msg);

    if (message.conversation || message.extendedTextMessage) {
        await handleText(sock, msg);
    } else if (message.stickerMessage) {
        await handleSticker(sock, msg);
    } else if (message.imageMessage || message.videoMessage || message.audioMessage || message.documentMessage) {
        await handleMedia(sock, msg);
    } else {
        await sock.sendMessage(msg.key.remoteJid, { text: "Unsupported message type" });
    }


}
