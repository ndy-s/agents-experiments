import makeWASocket, { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason 
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import { messageHandler } from "./handlers/messageHandler.js";

async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
    });

    sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log('Connection closed:', statusCode);

            if (statusCode !== DisconnectReason.loggedOut) {
                startWhatsApp();
            } else {
                console.log('❌ Logged out. Delete auth_info folder and re-run.');
            }
        } else if (connection === "open") {
            console.log("✅ Bot connected:", sock.user.id);
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        try {
            await messageHandler(sock, msg);
        } catch (error) {
            console.error("❌ Error processing message:", error);
        }
    });
}

async function main() {
    startWhatsApp();
}

main().catch(console.error);