

export async function handleMedia(sock, msg) {
    const message = msg.message;
    let fileType = "";
    
    if (message.imageMessage) fileType = "image";
    else if (message.videoMessage) fileType = "video";
    else if (message.audioMessage) fileType = "audio";
    else if (message.documentMessage) fileType = "document";

    await sock.sendMessage(msg.key.remoteJid, { text: `Received a ${fileType} file!` });
}

