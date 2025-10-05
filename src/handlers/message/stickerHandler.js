
export async function handleSticker(sock, msg) {
    await sock.sendMessage(msg.key.remoteJid, { text: "Nice sticker!" });
}

